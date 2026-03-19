'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  X,
  ChevronDown,
  Layers,
  Briefcase,
  Building2,
  Check,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useGraphStore, type PitchData } from '@/stores/useGraphStore';
import { NODE_COLORS, type SkillLevel } from '@/lib/constants';
import { MatchScoreCircle } from '@/components/graph/MatchScoreCircle';
import { Spinner } from '@/components/ui/Spinner';

const PitchHardGraph = dynamic(
  () =>
    import('../../../../components/graph/PitchHardGraph').then((m) => ({
      default: m.PitchHardGraph,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center h-full">
        <Spinner size="lg" className="text-primary" />
      </div>
    ),
  },
);

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
    endorsementCount?: number;
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
  forkCount: number;
  pitchData: PitchData;
}

function CategoryBreakdownItem({
  name,
  color,
  matchScore,
  matched,
  total,
}: {
  name: string;
  color: string;
  matchScore: number;
  matched: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-xs text-foreground/70 flex-1 truncate">{name}</span>
      <span className="text-xs tabular-nums text-muted-foreground">
        {matched}/{total}
      </span>
      <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${matchScore}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  );
}

export function PitchGraphViewer({ graph }: { graph: GraphData }) {
  const setGraph = useGraphStore((s) => s.setGraph);
  const setPitchMode = useGraphStore((s) => s.setPitchMode);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const pitchData = graph.pitchData;

  // Find selected node from graph props or ghost
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    // Check real nodes
    const real = graph.nodes.find((n) => n.id === selectedNodeId);
    if (real) return real;
    // Check ghost nodes
    if (selectedNodeId.startsWith('ghost-')) {
      const idx = parseInt(selectedNodeId.split('-')[1] ?? '', 10);
      const missing = pitchData.missingSkills[idx];
      if (missing) {
        return {
          id: selectedNodeId,
          name: missing.name,
          level: missing.requiredLevel,
          description: 'Required — not yet in graph',
          isUnlocked: false,
          positionX: 0,
          positionY: 0,
          _isMissing: true as const,
        };
      }
    }
    return null;
  }, [selectedNodeId, graph.nodes, pitchData.missingSkills]);

  const nodeStatus = selectedNodeId ? (pitchData.nodeMatchMap[selectedNodeId] ?? null) : null;
  const isMissing = selectedNode && '_isMissing' in selectedNode;

  // Resolve the vacancy requirement for the selected node (if applicable)
  const vacancyReq = useMemo(() => {
    if (!selectedNode) return null;
    const name = selectedNode.name.toLowerCase();
    // Find in pitchData missing skills or in matched/upgrade details
    if (isMissing) {
      const ms = pitchData.missingSkills.find((s) => s.name.toLowerCase() === name);
      return ms ? { requiredLevel: ms.requiredLevel, candidateLevel: null } : null;
    }
    // Look through nodeMatchMap to determine if it's in the vacancy
    if (nodeStatus === 'matched' || nodeStatus === 'upgrade') {
      // We need to find the required level — from categoryBreakdown or missingSkills, not available directly
      // The node's current level IS the candidate's level. Required level is in the vacancy skills.
      return { requiredLevel: null, candidateLevel: selectedNode.level };
    }
    return null;
  }, [selectedNode, nodeStatus, isMissing, pitchData.missingSkills]);

  // Selected node category
  const selectedCategory = useMemo(() => {
    if (!selectedNode || !('categoryId' in selectedNode) || !selectedNode.categoryId) return null;
    return graph.categories.find((c) => c.id === selectedNode.categoryId) ?? null;
  }, [selectedNode, graph.categories]);

  const levelColor = selectedNode
    ? (NODE_COLORS[selectedNode.level as SkillLevel] ?? '#6366F1')
    : '#6366F1';

  // Populate store: first set graph, then enable pitch mode
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

    // Enable pitch mode after graph is loaded
    setPitchMode(true, pitchData);

    return () => {
      setPitchMode(false);
      useGraphStore.getState().reset();
    };
  }, [graph, setGraph, setPitchMode, pitchData]);

  const author = graph.user.displayName || graph.user.username;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${author}'s Skills — ${pitchData.matchScore}% Match`, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-border gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/${graph.user.username}/${graph.slug}`}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label="Back to graph"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
              {graph.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                by{' '}
                <Link href={`/${graph.user.username}`} className="text-primary hover:underline">
                  {author}
                </Link>
              </p>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                <Briefcase className="w-3 h-3" />
                Pitch for: {pitchData.vacancyTitle}
                {pitchData.company && (
                  <span className="text-muted-foreground">
                    <Building2 className="w-3 h-3 inline mx-0.5" />
                    {pitchData.company}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <MatchScoreCircle score={pitchData.matchScore} size={56} />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{pitchData.matchedCount} matched</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{pitchData.upgradeCount} partial</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span>{pitchData.missingCount} missing</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="btn-ghost p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Share pitch link"
            aria-label="Share pitch link"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Match Summary */}
      <div className="sm:hidden flex items-center justify-between px-4 py-2 border-b border-border/50 bg-surface/50">
        <div className="flex items-center gap-2">
          <MatchScoreCircle score={pitchData.matchScore} size={40} />
          <div className="text-xs text-muted-foreground">
            <span className="text-emerald-400">{pitchData.matchedCount}</span> matched ·{' '}
            <span className="text-amber-400">{pitchData.upgradeCount}</span> partial ·{' '}
            <span className="text-red-400">{pitchData.missingCount}</span> gaps
          </div>
        </div>
      </div>

      {/* Graph + Side Panel */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Canvas */}
        <div className="flex-1 relative">
          <PitchHardGraph />
        </div>

        {/* Node Detail Side Panel — Desktop */}
        <AnimatePresence>
          {selectedNode && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="hidden md:flex w-[320px] border-l border-border/60 bg-surface/80 backdrop-blur-sm flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="relative px-5 pt-5 pb-4">
                <button
                  onClick={() => useGraphStore.getState().setSelectedNode(null)}
                  className="absolute top-3 right-3 p-2.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground/60 hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close node details"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-3 pr-8">
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

                {/* Pitch Status Badge */}
                {(nodeStatus || isMissing) && (
                  <div className="mt-2">
                    {nodeStatus === 'matched' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium">
                        <Check className="w-3 h-3" /> Skill Matched
                      </span>
                    )}
                    {nodeStatus === 'upgrade' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium">
                        <Zap className="w-3 h-3" /> Partial Match — Level Upgrade Needed
                      </span>
                    )}
                    {nodeStatus === 'bonus' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-medium">
                        ✦ Bonus Skill
                      </span>
                    )}
                    {isMissing && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[11px] font-medium">
                        <AlertTriangle className="w-3 h-3" /> Required — Not in Graph
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Level comparison for matched/upgrade */}
                {(nodeStatus === 'matched' || nodeStatus === 'upgrade') && vacancyReq && (
                  <div className="rounded-lg border border-border/50 px-3.5 py-3 space-y-2">
                    <span className="text-xs font-medium text-muted-foreground tracking-wide">
                      Level Comparison
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Your level</span>
                        <span
                          className="text-[11px] font-medium capitalize"
                          style={{ color: levelColor }}
                        >
                          {selectedNode.level}
                        </span>
                      </div>
                      {/* Visual bar */}
                      <div className="flex gap-1">
                        {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map(
                          (lvl) => {
                            const isCandidate =
                              (['beginner', 'intermediate', 'advanced', 'expert'] as const).indexOf(
                                selectedNode.level as SkillLevel,
                              ) >=
                              (['beginner', 'intermediate', 'advanced', 'expert'] as const).indexOf(
                                lvl,
                              );
                            return (
                              <div
                                key={lvl}
                                className="flex-1 h-1.5 rounded-full transition-colors"
                                style={{
                                  backgroundColor: isCandidate
                                    ? nodeStatus === 'matched'
                                      ? '#10B981'
                                      : '#F59E0B'
                                    : 'hsl(var(--border))',
                                }}
                              />
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedNode.description && !isMissing && (
                  <div className="text-[13px] text-foreground/60 leading-relaxed">
                    <p>{selectedNode.description}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-border/40">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                  <Layers className="w-3 h-3" />
                  {pitchData.matchedCount + pitchData.upgradeCount}/{pitchData.totalRequired} skills
                  covered
                </span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Node Detail — Mobile Bottom Sheet */}
        {selectedNode && (
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-surface/95 backdrop-blur-lg border-t border-border rounded-t-2xl shadow-2xl max-h-[min(55vh,calc(100dvh-5rem))] overflow-y-auto slide-up-sheet safe-bottom overscroll-contain">
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
              <button
                onClick={() => useGraphStore.getState().setSelectedNode(null)}
                className="p-2 rounded-lg hover:bg-surface-light text-muted-foreground min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 min-w-0 mb-3">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-foreground truncate">
                    {selectedNode.name}
                  </h3>
                  <span className="text-[11px] font-medium" style={{ color: `${levelColor}cc` }}>
                    {selectedNode.level.charAt(0).toUpperCase() + selectedNode.level.slice(1)}
                  </span>
                </div>
              </div>
              {/* Pitch status badge mobile */}
              {nodeStatus === 'matched' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium mb-3">
                  <Check className="w-3 h-3" /> Skill Matched
                </span>
              )}
              {nodeStatus === 'upgrade' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium mb-3">
                  <Zap className="w-3 h-3" /> Partial Match
                </span>
              )}
              {isMissing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[11px] font-medium mb-3">
                  <AlertTriangle className="w-3 h-3" /> Missing Skill
                </span>
              )}
              {selectedNode.description && !isMissing && (
                <p className="text-[13px] text-foreground/60 leading-relaxed mb-3">
                  {selectedNode.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown Drawer */}
      <div className="border-t border-border/50">
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="flex items-center justify-between w-full px-4 sm:px-6 py-2.5 hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-xs font-medium text-muted-foreground tracking-wide">
            Category Breakdown
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-300 ${detailsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: detailsOpen ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="px-4 sm:px-6 pb-3 max-w-xl">
              {pitchData.categoryBreakdown.map((cat) => (
                <CategoryBreakdownItem key={cat.name} {...cat} />
              ))}
              {pitchData.missingSkills.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <span className="text-[11px] font-medium text-red-400/80 tracking-wide">
                    Missing Skills ({pitchData.missingSkills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {pitchData.missingSkills.map((skill) => (
                      <span
                        key={skill.name}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400/80 text-[10px] border border-red-500/20"
                      >
                        {skill.name}
                        <span className="text-red-400/50 capitalize">{skill.requiredLevel}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Bar */}
      <footer className="flex items-center justify-between px-4 sm:px-6 py-2 border-t border-border bg-surface/50">
        <span className="text-[11px] text-muted-foreground/50">
          Powered by{' '}
          <Link href="/" className="text-primary/70 hover:text-primary hover:underline">
            HardGraph
          </Link>
          {' — Build your skill graph'}
        </span>
        <button
          onClick={handleShare}
          className="text-[11px] text-primary/70 hover:text-primary transition-colors"
        >
          Copy Pitch Link
        </button>
      </footer>
    </div>
  );
}
