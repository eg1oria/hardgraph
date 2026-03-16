'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Eye, Globe, Lock, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminFilter } from '@/components/admin/AdminFilter';
import { ConfirmModal } from '@/components/admin/AdminModal';

interface AdminGraph {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  viewCount: number;
  forkCount: number;
  createdAt: string;
  user: { id: string; username: string };
  _count: { nodes: number; edges: number; categories: number };
}

interface GraphsResponse {
  data: AdminGraph[];
  total: number;
}

const TAKE = 20;
const publicOptions = [
  { value: 'true', label: 'Public' },
  { value: 'false', label: 'Private' },
];

export default function AdminGraphsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [graphs, setGraphs] = useState<AdminGraph[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [publicFilter, setPublicFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminGraph | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGraphs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('take', String(TAKE));
      params.set('skip', String(skip));
      params.set('sortBy', sortBy);
      params.set('order', sortOrder);
      if (search) params.set('search', search);
      if (publicFilter) params.set('isPublic', publicFilter);

      const res = await api.get<GraphsResponse>(`/admin/graphs?${params}`);
      setGraphs(res.data);
      setTotal(res.total);
    } catch {
      toast('Failed to load graphs', 'error');
    } finally {
      setLoading(false);
    }
  }, [skip, sortBy, sortOrder, search, publicFilter, toast]);

  useEffect(() => {
    fetchGraphs();
  }, [fetchGraphs]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
    setSkip(0);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setSkip(0);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/graphs/${deleteTarget.id}`);
      toast('Graph deleted', 'success');
      setDeleteTarget(null);
      fetchGraphs();
    } catch {
      toast('Failed to delete graph', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (g: AdminGraph) => <span className="font-medium">{g.title}</span>,
    },
    {
      key: 'user',
      label: 'User',
      render: (g: AdminGraph) => <span className="text-muted-foreground">{g.user.username}</span>,
    },
    {
      key: 'nodes',
      label: 'Nodes',
      className: 'text-center',
      render: (g: AdminGraph) => <span className="text-center block">{g._count.nodes}</span>,
    },
    {
      key: 'viewCount',
      label: 'Views',
      sortable: true,
      className: 'text-center',
      render: (g: AdminGraph) => <span className="text-center block">{g.viewCount}</span>,
    },
    {
      key: 'isPublic',
      label: 'Status',
      render: (g: AdminGraph) =>
        g.isPublic ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <Globe className="w-3 h-3" /> Public
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" /> Private
          </span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (g: AdminGraph) => (
        <span className="text-muted-foreground">{new Date(g.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-28',
      render: (g: AdminGraph) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {g.isPublic && (
            <a
              href={`/${g.user.username}/${g.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Open public graph"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => router.push(`/admin/graphs/${g.id}`)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary-400 hover:bg-primary/10 transition-colors"
            title="View details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(g)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete graph"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Graphs</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AdminSearch value={search} onChange={handleSearch} placeholder="Search by title…" />
        </div>
        <AdminFilter
          label="All statuses"
          value={publicFilter}
          options={publicOptions}
          onChange={(v) => {
            setPublicFilter(v);
            setSkip(0);
          }}
        />
      </div>

      <AdminTable
        columns={columns}
        data={graphs}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        rowKey={(g) => g.id}
        onRowClick={(g) => router.push(`/admin/graphs/${g.id}`)}
      />

      <AdminPagination total={total} take={TAKE} skip={skip} onPageChange={setSkip} />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Graph"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All nodes, edges and categories will be permanently removed.`}
        loading={deleting}
      />
    </div>
  );
}
