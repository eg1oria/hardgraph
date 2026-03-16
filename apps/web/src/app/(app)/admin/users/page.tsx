'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminFilter } from '@/components/admin/AdminFilter';
import { ConfirmModal } from '@/components/admin/AdminModal';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  githubId: string | null;
  githubUsername: string | null;
  plan: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  _count: { graphs: number };
}

interface UsersResponse {
  data: AdminUser[];
  total: number;
}

const TAKE = 20;
const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];
const planOptions = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('take', String(TAKE));
      params.set('skip', String(skip));
      params.set('sortBy', sortBy);
      params.set('order', sortOrder);
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (planFilter) params.set('plan', planFilter);

      const res = await api.get<UsersResponse>(`/admin/users?${params}`);
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [skip, sortBy, sortOrder, search, roleFilter, planFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    setDeleting(deleteTarget.id);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast('User deleted', 'success');
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast('Failed to delete user', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleRoleChange = async (user: AdminUser, role: string) => {
    setUpdatingRole(user.id);
    try {
      await api.patch(`/admin/users/${user.id}`, { role });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      toast('Role updated', 'success');
    } catch {
      toast('Failed to update role', 'error');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handlePlanChange = async (user: AdminUser, plan: string) => {
    setUpdatingPlan(user.id);
    try {
      await api.patch(`/admin/users/${user.id}`, { plan });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, plan } : u)));
      toast('Plan updated', 'success');
    } catch {
      toast('Failed to update plan', 'error');
    } finally {
      setUpdatingPlan(null);
    }
  };

  const columns = [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      render: (u: AdminUser) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary-400 shrink-0">
            {(u.username ?? '?').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{u.username}</span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (u: AdminUser) => <span className="text-muted-foreground">{u.email}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (u: AdminUser) => (
        <select
          value={u.role}
          onChange={(e) => handleRoleChange(u, e.target.value)}
          disabled={updatingRole === u.id}
          className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 ${
            u.role === 'admin'
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-surface-light text-muted-foreground'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (u: AdminUser) => (
        <select
          value={u.plan}
          onChange={(e) => handlePlanChange(u, e.target.value)}
          disabled={updatingPlan === u.id}
          className="text-xs px-2 py-1 rounded-full bg-surface-light text-muted-foreground border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="free">free</option>
          <option value="pro">pro</option>
          <option value="enterprise">enterprise</option>
        </select>
      ),
    },
    {
      key: 'graphs',
      label: 'Graphs',
      sortable: true,
      className: 'text-center',
      render: (u: AdminUser) => <span className="text-center block">{u._count.graphs}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (u: AdminUser) => (
        <span className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-20',
      render: (u: AdminUser) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/admin/users/${u.id}`)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary-400 hover:bg-primary/10 transition-colors"
            title="View user"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(u)}
            disabled={u.role === 'admin'}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={u.role === 'admin' ? 'Cannot delete admin' : 'Delete user'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <AdminSearch
            value={search}
            onChange={handleSearch}
            placeholder="Search username or email…"
          />
        </div>
        <AdminFilter
          label="All roles"
          value={roleFilter}
          options={roleOptions}
          onChange={(v) => {
            setRoleFilter(v);
            setSkip(0);
          }}
        />
        <AdminFilter
          label="All plans"
          value={planFilter}
          options={planOptions}
          onChange={(v) => {
            setPlanFilter(v);
            setSkip(0);
          }}
        />
      </div>

      <AdminTable
        columns={columns}
        data={users}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        rowKey={(u) => u.id}
        onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
      />

      <AdminPagination total={total} take={TAKE} skip={skip} onPageChange={setSkip} />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.username}"? This will also delete all their graphs and data. This action cannot be undone.`}
        loading={!!deleting}
      />
    </div>
  );
}
