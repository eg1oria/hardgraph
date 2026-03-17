'use client';

import { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Eye,
  Trash2,
  ExternalLink,
  GitFork,
  Github,
  Star,
  Code2,
  FileText,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { SkillStatsSection } from '@/components/profile/SkillStatsSection';

// Lazy-load EmbedModal — only shown when user clicks embed button (Lighthouse: reduce unused JS)
const EmbedModal = lazy(() =>
  import('@/components/embed/EmbedModal').then((m) => ({ default: m.EmbedModal })),
);

interface Graph {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  theme: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  _count: { nodes: number; edges: number };
  forkCount: number;
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState(false);
  const [embedGraph, setEmbedGraph] = useState<Graph | null>(null);
  const [scanCreating, setScanCreating] = useState(false);
  const [skillStats, setSkillStats] = useState<
    Array<{
      name: string;
      color: string;
      score: number;
      skills: Array<{
        name: string;
        level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        weight: number;
      }>;
    }>
  >([]);

  const fetchGraphs = useCallback(() => {
    api
      .get<Graph[]>('/graphs')
      .then((data) => {
        setGraphs(data);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const fetchStats = useCallback(() => {
    api
      .get<typeof skillStats>('/users/me/stats')
      .then(setSkillStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchGraphs();
    fetchStats();
  }, [fetchGraphs, fetchStats]);

  useEffect(() => {
    if (user?.githubUsername) {
      setReposLoading(true);
      api
        .get<GithubRepo[]>('/github/repos')
        .then((data) => setRepos(data))
        .catch(() => {
          setReposError(true);
        })
        .finally(() => setReposLoading(false));
    }
  }, [user?.githubUsername]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<Graph>('/graphs', {
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
      });
      setShowCreate(false);
      setCreateForm({ title: '', description: '' });
      toast('Graph created!', 'success');
      router.push(`/editor/${res.id}`);
    } catch {
      toast('Failed to create graph', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/graphs/${id}`);
      setGraphs((prev) => prev.filter((g) => g.id !== id));
      fetchStats();
      toast('Graph deleted', 'success');
    } catch {
      toast('Failed to delete graph', 'error');
    }
  };

  const handleCreateFromScan = async () => {
    setScanCreating(true);
    try {
      const res = await api.post<{ id: string; slug: string }>('/graphs/from-scan');
      toast('Graph created from GitHub!', 'success');
      router.push(`/editor/${res.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create graph from GitHub scan';
      toast(message, 'error');
    } finally {
      setScanCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {user?.displayName ? `Welcome, ${user.displayName}` : 'Your Skill Graphs'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage your interactive skill trees
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.githubUsername && (
            <button
              onClick={handleCreateFromScan}
              disabled={scanCreating}
              className="btn-secondary flex items-center gap-2"
            >
              {scanCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Github className="w-4 h-4" />
              )}
              {scanCreating ? 'Scanning...' : 'From GitHub'}
            </button>
          )}
          <button
            data-onboarding="create-graph"
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Graph
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<GitFork className="w-12 h-12" />}
          title="Failed to load graphs"
          description="Something went wrong while loading your skill trees. Please try again."
          action={
            <button
              onClick={() => {
                setError(false);
                setLoading(true);
                fetchGraphs();
              }}
              className="btn-secondary"
            >
              Retry
            </button>
          }
          className="rounded-xl border border-dashed border-border"
        />
      ) : graphs.length === 0 ? (
        <EmptyState
          icon={<GitFork className="w-12 h-12" />}
          title="No graphs yet"
          description="Create your first skill tree to showcase your expertise and share it with the world."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Create your first graph
            </button>
          }
          className="rounded-xl border border-dashed border-border"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {graphs.map((graph) => (
            <div key={graph.id} className="group card-hover relative flex flex-col">
              <Link
                href={`/editor/${graph.id}`}
                className="absolute inset-0 z-0"
                aria-label={`Open graph: ${graph.title}`}
              />

              <div className="relative z-10 pointer-events-none flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-semibold text-[15px] group-hover:text-primary-400 transition-colors truncate pr-2">
                    {graph.title}
                  </h2>
                  <Badge variant={graph.isPublic ? 'primary' : 'muted'}>
                    {graph.isPublic ? 'Public' : 'Private'}
                  </Badge>
                </div>

                {graph.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {graph.description}
                  </p>
                )}

                <div className="mt-auto">
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {graph._count.nodes} nodes
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                      {graph._count.edges} edges
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {graph.viewCount}
                    </span>
                    {graph.forkCount > 0 && (
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" />
                        {graph.forkCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted">{formatDate(graph.createdAt)}</span>
                    <div className="flex items-center gap-0.5 pointer-events-auto">
                      {graph.isPublic && user && (
                        <a
                          href={`/${user.username}/${graph.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-surface-light text-muted hover:text-foreground transition-colors"
                          title="View public page"
                          aria-label={`View ${graph.title} public page`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {graph.isPublic && user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmbedGraph(graph);
                          }}
                          className="p-1.5 rounded-md hover:bg-cyan-500/10 text-muted hover:text-cyan-400 transition-colors"
                          title="Embed skill card"
                          aria-label={`Embed ${graph.title}`}
                        >
                          <Code2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {graph.isPublic && user && (
                        <a
                          href={`/${user.username}/resume/${graph.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted hover:text-emerald-400 transition-colors"
                          title="Generate CV"
                          aria-label={`Generate CV from ${graph.title}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(graph.id, graph.title);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
                        title="Delete graph"
                        aria-label={`Delete ${graph.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Skill Stats */}
      {skillStats.length > 0 && <SkillStatsSection skillStats={skillStats} />}

      {/* GitHub Repos Section */}
      {user?.githubUsername && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">GitHub Repositories</h2>
            <span className="text-xs text-muted-foreground">({repos.length})</span>
          </div>

          {reposLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : reposError ? (
            <p className="text-sm text-muted-foreground">Failed to load repositories.</p>
          ) : repos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public repositories found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {repos.slice(0, 9).map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-hover group"
                >
                  <h3 className="font-semibold text-sm group-hover:text-primary-400 transition-colors truncate">
                    {repo.name}
                  </h3>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {repo.stargazers_count}
                      </span>
                    )}
                    {repo.forks_count > 0 && (
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" />
                        {repo.forks_count}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Graph Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Graph">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Title</label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="e.g., My Frontend Skills"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Description <span className="text-muted">(optional)</span>
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              className="input-field resize-none"
              rows={3}
              placeholder="What skills does this graph cover?"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Creating...' : 'Create Graph'}
            </button>
          </div>
        </form>
      </Modal>

      {embedGraph && user?.username && (
        <Suspense fallback={null}>
          <EmbedModal
            open={!!embedGraph}
            onClose={() => setEmbedGraph(null)}
            username={user.username}
            slug={embedGraph.slug}
            title={embedGraph.title}
            isPublic={embedGraph.isPublic}
            nodeCount={embedGraph._count.nodes}
            updatedAt={embedGraph.updatedAt}
          />
        </Suspense>
      )}
    </div>
  );
}
