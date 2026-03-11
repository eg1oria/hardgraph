'use client';

import { useEffect, useMemo, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Share2,
  X,
  Github,
  Star,
  GitFork,
  Layers,
  ChevronDown,
} from 'lucide-react';

import { SkillGraph } from '@/components/graph/SkillGraph';
import { HashtagText } from '@/components/graph/HashtagText';
import { useGraphStore } from '@/stores/useGraphStore';
import { NODE_COLORS, type SkillLevel } from '@/lib/constants';
import { hasHashtags } from '@/lib/hashtag-parser';
import { api } from '@/lib/api';

interface GraphData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  theme: string;
  viewCount: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  nodes: Array<{
    id: string;
    name: string;
    description?: string;
    level: string;
    nodeType?: string;
    icon?: string;
    positionX: number;
    positionY: number;
    categoryId?: string;
    isUnlocked: boolean;
    customData?: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    label?: string;
    edgeType: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    color?: string;
    sortOrder: number;
  }>;
}

interface ConnNode {
  id: string;
  name: string;
  level: string;
}

function ConnectionSection({ label, nodes }: { label: string; nodes: ConnNode[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-3.5 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs font-medium text-muted-foreground tracking-wide">{label}</span>
        <span className="flex items-center gap-1.5">
          <span className="text-xs tabular-nums text-foreground/50">{nodes.length}</span>
          <ChevronDown
            className={`w-3 h-3 text-muted-foreground/60 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-2 pb-2 space-y-0.5">
            {nodes.map((node) => {
              const color = NODE_COLORS[node.level as SkillLevel] ?? '#6366F1';
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => useGraphStore.getState().setSelectedNode(node.id)}
                  className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors text-left group/item"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 ring-2 ring-transparent group-hover/item:ring-current/10 transition-shadow"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[13px] text-foreground/70 group-hover/item:text-foreground truncate transition-colors">
                    {node.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicGraphViewer({ graph }: { graph: GraphData }) {
  const setGraph = useGraphStore((s) => s.setGraph);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const storeNodes = useGraphStore((s) => s.nodes);
  const storeEdges = useGraphStore((s) => s.edges);

  // Find selected node from the store (populated in useEffect below)
  const selectedNode =
    storeNodes.find((n) => n.id === selectedNodeId) ??
    graph.nodes.find((n) => n.id === selectedNodeId);
  const isRepoNode = selectedNode?.nodeType === 'repository';
  const repoUrl = isRepoNode
    ? (selectedNode?.customData?.repoUrl as string | undefined)
    : undefined;

  // Resolve category for the selected node
  const selectedCategory = useMemo(() => {
    if (!selectedNode?.categoryId) return null;
    return graph.categories.find((c) => c.id === selectedNode.categoryId) ?? null;
  }, [selectedNode?.categoryId, graph.categories]);

  // Resolve connected nodes (dependencies + dependents)
  const connections = useMemo(() => {
    if (!selectedNodeId) return { dependencies: [], dependents: [] };
    const edges = storeEdges.length > 0 ? storeEdges : graph.edges;
    const allNodes = storeNodes.length > 0 ? storeNodes : graph.nodes;
    const findNode = (id: string) => allNodes.find((n) => n.id === id);
    return {
      dependencies: edges
        .filter((e) => e.sourceNodeId === selectedNodeId)
        .map((e) => findNode(e.targetNodeId))
        .filter(Boolean) as typeof allNodes,
      dependents: edges
        .filter((e) => e.targetNodeId === selectedNodeId)
        .map((e) => findNode(e.sourceNodeId))
        .filter(Boolean) as typeof allNodes,
    };
  }, [selectedNodeId, storeEdges, storeNodes, graph.edges, graph.nodes]);

  // Populate store with graph data for SkillGraph to read
  useEffect(() => {
    setGraph({
      id: graph.id,
      title: graph.title,
      slug: graph.slug,
      isPublic: true,
      nodes: graph.nodes,
      edges: graph.edges,
      categories: graph.categories,
    });
  }, [graph, setGraph]);

  // Track analytics view
  useEffect(() => {
    api
      .post('/analytics/track', {
        graphId: graph.id,
        referrer: document.referrer || null,
      })
      .catch(() => {});
  }, [graph.id]);

  const author = graph.user.displayName || graph.user.username;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: graph.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const levelColor = selectedNode
    ? (NODE_COLORS[selectedNode.level as SkillLevel] ?? '#6366F1')
    : '#6366F1';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/${graph.user.username}`}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="Back to profile"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
              {graph.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              by{' '}
              <Link href={`/${graph.user.username}`} className="text-primary hover:underline">
                {author}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            {graph.viewCount}
          </span>
          <button
            onClick={handleShare}
            className="btn-ghost p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Share"
            aria-label="Share this graph"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Graph + Side Panel */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <SkillGraph readonly />
          </ReactFlowProvider>
        </div>

        {/* Node Detail Side Panel — Desktop */}
        {selectedNode && (
          <aside className="hidden md:flex w-[320px] border-l border-border/60 bg-surface/80 backdrop-blur-sm flex-col animate-in slide-in-from-right-4 duration-300 ease-out overflow-hidden">
            {/* Header */}
            <div className="relative px-5 pt-5 pb-4">
              <button
                onClick={() => useGraphStore.getState().setSelectedNode(null)}
                className="absolute top-3 right-3 p-2.5 rounded-lg hover:bg-white/[0.06] active:bg-white/[0.06] text-muted-foreground/60 hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close node details"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-3 pr-8">
                {isRepoNode && (
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Github className="w-4 h-4 text-purple-400/80" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-foreground truncate leading-tight">
                    {selectedNode.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide"
                      style={{ color: `${levelColor}cc` }}
                    >
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: levelColor }}
                      />
                      {selectedNode.level.charAt(0).toUpperCase() + selectedNode.level.slice(1)}
                    </span>
                    {selectedCategory && (
                      <>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: selectedCategory.color ?? '#6366F1' }}
                          />
                          {selectedCategory.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Description */}
              {selectedNode.description && (
                <div className="text-[13px] text-foreground/60 leading-relaxed">
                  {hasHashtags(selectedNode.description) ? (
                    <HashtagText text={selectedNode.description} />
                  ) : (
                    <p>{selectedNode.description}</p>
                  )}
                </div>
              )}

              {/* Connected nodes */}
              {(connections.dependents.length > 0 || connections.dependencies.length > 0) && (
                <div className="space-y-2">
                  {connections.dependents.length > 0 && (
                    <ConnectionSection label="Depends on" nodes={connections.dependents} />
                  )}
                  {connections.dependencies.length > 0 && (
                    <ConnectionSection label="Connected to" nodes={connections.dependencies} />
                  )}
                </div>
              )}

              {/* Repository details */}
              {isRepoNode && selectedNode.customData && (
                <div className="rounded-lg border border-border/50 px-3.5 py-3 space-y-3">
                  <span className="text-xs font-medium text-muted-foreground tracking-wide">
                    Repository
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {(selectedNode.customData.language as string) && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
                        <span className="w-2 h-2 rounded-full bg-purple-400/70" />
                        {selectedNode.customData.language as string}
                      </span>
                    )}
                    {((selectedNode.customData.stars as number) ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/80">
                        <Star className="w-3 h-3 text-amber-400/70" />
                        {selectedNode.customData.stars as number}
                      </span>
                    )}
                    {((selectedNode.customData.forks as number) ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/80">
                        <GitFork className="w-3 h-3 text-muted-foreground/50" />
                        {selectedNode.customData.forks as number}
                      </span>
                    )}
                  </div>
                  {repoUrl && (
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md text-[13px] font-medium text-purple-300/90 hover:text-purple-300 bg-purple-500/[0.06] hover:bg-purple-500/[0.1] border border-purple-500/10 hover:border-purple-500/20 transition-all"
                    >
                      <Github className="w-3.5 h-3.5" />
                      Open on GitHub
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-border/40">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                <Layers className="w-3 h-3" />
                {graph.nodes.length} nodes
              </span>
            </div>
          </aside>
        )}

        {/* Node Detail — Mobile Bottom Sheet */}
        {selectedNode && (
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-surface/95 backdrop-blur-lg border-t border-border rounded-t-2xl shadow-2xl max-h-[55vh] overflow-y-auto slide-up-sheet safe-bottom">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {isRepoNode && (
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Github className="w-4 h-4 text-purple-400/80" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-foreground truncate">
                      {selectedNode.name}
                    </h3>
                    <span className="text-[11px] font-medium" style={{ color: `${levelColor}cc` }}>
                      {selectedNode.level.charAt(0).toUpperCase() + selectedNode.level.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => useGraphStore.getState().setSelectedNode(null)}
                  className="p-2.5 rounded-lg hover:bg-surface-light text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedNode.description && (
                <p className="text-[13px] text-foreground/60 leading-relaxed mb-3">
                  {hasHashtags(selectedNode.description) ? (
                    <HashtagText text={selectedNode.description} />
                  ) : (
                    selectedNode.description
                  )}
                </p>
              )}
              {isRepoNode && repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-purple-300/90 bg-purple-500/[0.06] border border-purple-500/10 transition-all min-h-[44px]"
                >
                  <Github className="w-4 h-4" />
                  Open on GitHub
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description footer */}
      {graph.description && (
        <footer className="px-4 sm:px-6 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground max-w-2xl">{graph.description}</p>
        </footer>
      )}
    </div>
  );
}
