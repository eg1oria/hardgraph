'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Loader2, Globe, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

interface AdminGraph {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
  user: { username: string };
  _count: { nodes: number };
}

export default function AdminGraphsPage() {
  const [graphs, setGraphs] = useState<AdminGraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    api
      .get<AdminGraph[]>('/admin/graphs')
      .then((res) => setGraphs(res.data))
      .catch(() => toast('Failed to load graphs', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete graph "${title}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/graphs/${id}`);
      setGraphs((prev) => prev.filter((g) => g.id !== id));
      toast('Graph deleted', 'success');
    } catch {
      toast('Failed to delete graph', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-1.5 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Graphs</h1>
          <p className="text-sm text-muted-foreground">{graphs.length} total</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Nodes</th>
                <th className="px-4 py-3 font-medium">Public</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : graphs.map((graph) => (
                    <tr key={graph.id} className="hover:bg-surface-light/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{graph.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{graph.user.username}</td>
                      <td className="px-4 py-3 text-center">{graph._count.nodes}</td>
                      <td className="px-4 py-3">
                        {graph.isPublic ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <Globe className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(graph.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(graph.id, graph.title)}
                          disabled={deleting === graph.id}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                          title="Delete graph"
                        >
                          {deleting === graph.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
