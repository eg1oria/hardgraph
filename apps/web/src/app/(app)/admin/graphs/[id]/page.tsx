'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  Lock,
  Eye,
  GitFork,
  Boxes,
  Link2,
  Layers,
  Palette,
  Calendar,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/admin/AdminModal';

interface GraphDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  isPublic: boolean;
  isPrimary: boolean;
  theme: string;
  viewCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
  _count: { nodes: number; edges: number; categories: number };
}

export default function AdminGraphDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [graph, setGraph] = useState<GraphDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);

  useEffect(() => {
    api
      .get<GraphDetail>(`/admin/graphs/${id}`)
      .then(setGraph)
      .catch(() => toast('Failed to load graph', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const handleTogglePublic = async () => {
    if (!graph) return;
    setTogglingPublic(true);
    try {
      await api.patch(`/admin/graphs/${id}`, { isPublic: !graph.isPublic });
      setGraph((prev) => (prev ? { ...prev, isPublic: !prev.isPublic } : prev));
      toast(`Graph is now ${graph.isPublic ? 'private' : 'public'}`, 'success');
    } catch {
      toast('Failed to update graph', 'error');
    } finally {
      setTogglingPublic(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/graphs/${id}`);
      toast('Graph deleted', 'success');
      router.push('/admin/graphs');
    } catch {
      toast('Failed to delete graph', 'error');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-muted-foreground">Graph not found</p>
      </div>
    );
  }

  const stats = [
    { label: 'Nodes', value: graph._count.nodes, icon: Boxes, color: 'text-purple-400' },
    { label: 'Edges', value: graph._count.edges, icon: Link2, color: 'text-cyan-400' },
    { label: 'Categories', value: graph._count.categories, icon: Layers, color: 'text-amber-400' },
    { label: 'Views', value: graph.viewCount, icon: Eye, color: 'text-blue-400' },
    { label: 'Forks', value: graph.forkCount, icon: GitFork, color: 'text-emerald-400' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/graphs')}
          className="p-1.5 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{graph.title}</h1>
          <p className="text-sm text-muted-foreground">
            by{' '}
            <button
              onClick={() => router.push(`/admin/users/${graph.user.id}`)}
              className="text-primary-400 hover:underline"
            >
              {graph.user.username}
            </button>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {graph.isPublic && (
            <a
              href={`/${graph.user.username}/${graph.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary-400 hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </a>
          )}
          <button
            onClick={() => setShowDelete(true)}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold">{s.value.toLocaleString()}</p>
          </Card>
        ))}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium mb-3">Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-xs">{graph.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Theme</span>
              <span className="flex items-center gap-1">
                <Palette className="w-3 h-3" /> {graph.theme}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary</span>
              <span>{graph.isPrimary ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(graph.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{new Date(graph.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium mb-3">Visibility</h3>
          <div className="flex items-center gap-3 mb-4">
            {graph.isPublic ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <Globe className="w-5 h-5" />
                <span className="font-medium">Public</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Private</span>
              </div>
            )}
          </div>
          {graph.description && (
            <p className="text-sm text-muted-foreground mb-4">{graph.description}</p>
          )}
          <button
            onClick={handleTogglePublic}
            disabled={togglingPublic}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary-400 hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {togglingPublic ? 'Updating…' : `Make ${graph.isPublic ? 'Private' : 'Public'}`}
          </button>
        </Card>
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Graph"
        message={`Are you sure you want to delete "${graph.title}"? All nodes, edges and categories will be permanently removed.`}
        loading={deleting}
      />
    </div>
  );
}
