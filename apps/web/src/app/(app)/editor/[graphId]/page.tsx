'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Layers,
  Settings2,
  Globe,
  Lock,
  Link2,
  Check,
  Loader2,
  Github,
  MoreHorizontal,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ReactFlowProvider } from '@xyflow/react';

import { useGraphStore, type GraphNode } from '@/stores/useGraphStore';
import { useGraph } from '@/hooks/useGraph';
import { useNodes } from '@/hooks/useNodes';
import { useEdges } from '@/hooks/useEdges';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { SkillGraph } from '@/components/graph/SkillGraph';
import { NodeDetailPanel } from '@/components/graph/NodeDetailPanel';
import { AddNodeModal } from '@/components/editor/AddNodeModal';
import { CategoryManager } from '@/components/editor/CategoryManager';
import { ImportGithubModal } from '@/components/ImportGithubModal';
import { NODE_COLORS } from '@/lib/constants';
import type { SkillLevel } from '@/lib/constants';

export default function EditorPage() {
  const { graphId } = useParams<{ graphId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { loading, error, saveGraph } = useGraph(graphId);
  const { createNode, editNode, deleteNode, evolveNode } = useNodes();
  const { deleteEdge } = useEdges();

  const user = useAuthStore((s) => s.user);
  const title = useGraphStore((s) => s.title);
  const slug = useGraphStore((s) => s.slug);
  const isPublic = useGraphStore((s) => s.isPublic);
  const setIsPublic = useGraphStore((s) => s.setIsPublic);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const isDirty = useGraphStore((s) => s.isDirty);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportGithub, setShowImportGithub] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileNodeList, setShowMobileNodeList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Redirect on error
  useEffect(() => {
    if (error) {
      toast('Graph not found', 'error');
      router.push('/dashboard');
    }
  }, [error, toast, router]);

  // Warn about unsaved changes before leaving
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useGraphStore.getState().isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveGraph();
    setSaving(false);
  }, [saveGraph]);

  const handleTogglePublic = useCallback(async () => {
    const next = !isPublic;
    setPublishing(true);
    setIsPublic(next); // optimistic
    try {
      await api.put(`/graphs/${graphId}`, { isPublic: next });
      toast(next ? 'Graph is now public!' : 'Graph is now private', next ? 'success' : 'info');
    } catch {
      setIsPublic(!next); // rollback
      toast('Failed to update visibility', 'error');
    } finally {
      setPublishing(false);
    }
  }, [isPublic, graphId, setIsPublic, toast]);

  const handleCopyLink = useCallback(() => {
    if (!user?.username || !slug) return;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${appUrl}/${user.username}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast('Link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  }, [user, slug, toast]);

  const handleAddNode = useCallback(
    async (data: {
      name: string;
      description: string;
      level: string;
      icon: string;
      categoryId: string;
    }) => {
      const count = nodes.length;
      const col = count % 4;
      const row = Math.floor(count / 4);
      await createNode({
        name: data.name,
        description: data.description || undefined,
        level: data.level,
        icon: data.icon || undefined,
        positionX: 100 + col * 250,
        positionY: 100 + row * 200,
        categoryId: data.categoryId || undefined,
      });
    },
    [createNode, nodes.length],
  );

  const handleImportRepos = useCallback(
    async (
      repos: Array<{
        name: string;
        description?: string;
        nodeType: string;
        level: string;
        customData: Record<string, unknown>;
      }>,
    ) => {
      const startCount = useGraphStore.getState().nodes.length;
      const promises = repos.map((repo, i) => {
        const idx = startCount + i;
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        return createNode({
          name: repo.name,
          description: repo.description,
          nodeType: repo.nodeType,
          level: repo.level,
          positionX: 100 + col * 250,
          positionY: 100 + row * 200,
          customData: repo.customData,
        });
      });
      await Promise.all(promises);
      toast(`Imported ${repos.length} repositories`, 'success');
    },
    [createNode, toast],
  );

  const handleUpdateNode = useCallback(
    (id: string, data: Partial<GraphNode>) => {
      editNode(id, data);
    },
    [editNode],
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      deleteNode(id);
    },
    [deleteNode],
  );

  const handleEvolveNode = useCallback(
    (id: string) => {
      evolveNode(id);
    },
    [evolveNode],
  );

  const handleDeleteSelectedEdge = useCallback(() => {
    if (selectedEdgeId) deleteEdge(selectedEdgeId);
  }, [selectedEdgeId, deleteEdge]);

  // Keyboard shortcuts — use refs to avoid re-subscribing on every render
  const handleSaveRef = useRef(handleSave);
  const handleDeleteSelectedEdgeRef = useRef(handleDeleteSelectedEdge);
  useEffect(() => {
    handleSaveRef.current = handleSave;
    handleDeleteSelectedEdgeRef.current = handleDeleteSelectedEdge;
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const edgeId = useGraphStore.getState().selectedEdgeId;
        if (
          edgeId &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement)
        ) {
          e.preventDefault();
          handleDeleteSelectedEdgeRef.current();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100dvh-3.5rem)] flex items-center justify-center">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-[calc(100dvh-3.5rem)] flex flex-col">
        {/* Editor Toolbar */}
        <div className="h-12 border-b border-border flex items-center px-2 sm:px-3 gap-1 bg-surface shrink-0">
          {/* Left: back + title */}
          <Link
            href="/dashboard"
            className="p-2 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="mx-1 h-5 w-px bg-border shrink-0" />

          <span className="text-sm font-medium truncate max-w-[8rem] sm:max-w-48 shrink-0">
            {title || 'Untitled Graph'}
          </span>
          {isDirty && <span className="text-xs text-amber-400 ml-1 shrink-0">●</span>}

          <div className="flex-1 min-w-1" />

          {/* Desktop-only buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary-400 hover:bg-primary/20 active:bg-primary/20 transition-colors shrink-0 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Node</span>
            </button>

            <button
              onClick={() => setShowImportGithub(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 active:bg-purple-500/20 transition-colors shrink-0 min-h-[36px]"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            <Badge variant="muted" className="mx-1 hidden lg:inline-flex">
              {nodes.length} nodes · {edges.length} edges
            </Badge>

            <button
              onClick={handleTogglePublic}
              disabled={publishing}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 min-h-[36px] ${
                isPublic
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-surface-light text-muted-foreground hover:text-foreground'
              }`}
              title={isPublic ? 'Make private' : 'Make public'}
            >
              {publishing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isPublic ? (
                <Globe className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>{isPublic ? 'Public' : 'Private'}</span>
            </button>

            {isPublic && (
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary-400 hover:bg-primary/20 active:bg-primary/20 transition-colors shrink-0 min-h-[36px]"
                title="Copy public link"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy link'}</span>
              </button>
            )}

            <div className="mx-0.5 h-5 w-px bg-border shrink-0" />

            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-light transition-colors shrink-0 min-w-[36px] min-h-[36px] hidden md:flex items-center justify-center"
              aria-label="Toggle properties panel"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save button (always visible) */}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="btn-primary !py-1.5 !px-2 sm:!px-3 !text-xs !min-h-[36px] disabled:opacity-40"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Mobile more menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-light transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {showMobileMenu && (
          <>
            <div
              className="fixed inset-0 z-40 sm:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="sm:hidden absolute top-12 right-2 z-50 w-56 max-w-[calc(100vw-1rem)] bg-surface border border-border rounded-xl shadow-2xl py-1 animate-in max-h-[calc(100dvh-8rem)] overflow-y-auto">
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-light active:bg-surface-light transition-colors"
              >
                <Plus className="w-4 h-4 text-primary-400" />
                Add Node
              </button>
              <button
                onClick={() => {
                  setShowImportGithub(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-light active:bg-surface-light transition-colors"
              >
                <Github className="w-4 h-4 text-purple-400" />
                Import GitHub
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => {
                  handleTogglePublic();
                  setShowMobileMenu(false);
                }}
                disabled={publishing}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-light active:bg-surface-light transition-colors"
              >
                {isPublic ? (
                  <Globe className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
                {isPublic ? 'Make Private' : 'Make Public'}
              </button>
              {isPublic && (
                <button
                  onClick={() => {
                    handleCopyLink();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-light active:bg-surface-light transition-colors"
                >
                  <Link2 className="w-4 h-4 text-primary-400" />
                  Copy Link
                </button>
              )}
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => {
                  setShowMobileNodeList(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-surface-light active:bg-surface-light transition-colors"
              >
                <Layers className="w-4 h-4 text-muted-foreground" />
                Nodes & Categories
              </button>
              <div className="px-4 py-2 text-xs text-muted">
                {nodes.length} nodes · {edges.length} edges
              </div>
            </div>
          </>
        )}

        {/* Editor body */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Canvas area */}
          <div className="flex-1 relative">
            {nodes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="relative text-center animate-in z-10 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Start building your skill tree</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                    Add your first skill node to get started. Drag nodes to position them, then
                    connect them with edges.
                  </p>
                  <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4" />
                    Add first node
                  </button>
                </div>
              </div>
            ) : (
              <SkillGraph />
            )}

            {/* Mobile FAB — Add Node (visible only when there are existing nodes) */}
            {nodes.length > 0 && !selectedNodeId && (
              <button
                onClick={() => setShowAddModal(true)}
                className="md:hidden fixed z-20 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
                style={{
                  bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
                  right: '1rem',
                }}
                aria-label="Add node"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Right panel - Desktop */}
          {showRightPanel && (
            <aside className="w-72 border-l border-border bg-surface overflow-y-auto shrink-0 hidden md:block">
              <div className="border-b border-border">
                <div className="p-4 pb-0">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <Settings2 className="w-4 h-4 text-muted" />
                    Properties
                  </h3>
                </div>
                <NodeDetailPanel onUpdate={handleUpdateNode} onDelete={handleDeleteNode} onEvolve={handleEvolveNode} />
              </div>
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-muted" />
                  Categories
                </h3>
                <CategoryManager />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-3">Nodes ({nodes.length})</h3>
                {nodes.length === 0 ? (
                  <p className="text-xs text-muted">No nodes yet</p>
                ) : (
                  <div className="space-y-1">
                    {nodes.map((node) => (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(node.id)}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs transition-colors cursor-pointer text-left min-h-[36px] ${
                          selectedNodeId === node.id
                            ? 'bg-primary/10 text-foreground'
                            : 'hover:bg-surface-light text-muted-foreground'
                        }`}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: NODE_COLORS[node.level as SkillLevel] ?? '#6366F1',
                          }}
                        />
                        <span className="truncate">{node.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Mobile Bottom Sheet — Node Properties */}
          {selectedNodeId && (
            <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-surface border-t border-border rounded-t-2xl shadow-2xl max-h-[min(50vh,calc(100dvh-6rem))] overflow-y-auto slide-up-sheet safe-bottom">
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 rounded-full bg-border" />
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-light transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <NodeDetailPanel onUpdate={handleUpdateNode} onDelete={handleDeleteNode} onEvolve={handleEvolveNode} />
            </div>
          )}

          {/* Mobile Bottom Sheet — Nodes & Categories */}
          {showMobileNodeList && (
            <>
              <div
                className="md:hidden fixed inset-0 bg-black/40 z-30"
                onClick={() => setShowMobileNodeList(false)}
              />
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border rounded-t-2xl shadow-2xl max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto slide-up-sheet safe-bottom overscroll-contain">
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border sticky top-0 bg-surface">
                  <h3 className="text-sm font-semibold">Nodes & Categories</h3>
                  <button
                    onClick={() => setShowMobileNodeList(false)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-light transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Categories
                  </h4>
                  <CategoryManager />
                </div>
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Nodes ({nodes.length})
                  </h4>
                  {nodes.length === 0 ? (
                    <p className="text-xs text-muted">No nodes yet</p>
                  ) : (
                    <div className="space-y-1">
                      {nodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => {
                            setSelectedNode(node.id);
                            setShowMobileNodeList(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer text-left min-h-[44px] ${
                            selectedNodeId === node.id
                              ? 'bg-primary/10 text-foreground'
                              : 'hover:bg-surface-light active:bg-surface-light text-muted-foreground'
                          }`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: NODE_COLORS[node.level as SkillLevel] ?? '#6366F1',
                            }}
                          />
                          <span className="truncate">{node.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AddNodeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddNode}
      />

      <ImportGithubModal
        open={showImportGithub}
        onClose={() => setShowImportGithub(false)}
        onImport={handleImportRepos}
      />
    </ReactFlowProvider>
  );
}
