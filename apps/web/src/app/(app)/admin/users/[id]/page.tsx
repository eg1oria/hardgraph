'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Github,
  Calendar,
  Shield,
  CreditCard,
  Eye,
  Trash2,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/admin/AdminModal';

interface UserGraph {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  _count: { nodes: number };
}

interface UserDetail {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  githubId: string | null;
  githubUsername: string | null;
  role: string;
  plan: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  graphs: UserGraph[];
  totalViews: number;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingGraph, setDeletingGraph] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<UserDetail>(`/admin/users/${id}`)
      .then((data) => {
        setUser(data);
        setEditRole(data.role);
        setEditPlan(data.plan);
      })
      .catch(() => toast('Failed to load user', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}`, { role: editRole, plan: editPlan });
      setUser((prev) => (prev ? { ...prev, role: editRole, plan: editPlan } : prev));
      toast('User updated', 'success');
      setEditing(false);
    } catch {
      toast('Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${id}`);
      toast('User deleted', 'success');
      router.push('/admin/users');
    } catch {
      toast('Failed to delete user', 'error');
      setDeleting(false);
    }
  };

  const handleDeleteGraph = async (graphId: string) => {
    setDeletingGraph(graphId);
    try {
      await api.delete(`/admin/graphs/${graphId}`);
      setUser((prev) =>
        prev ? { ...prev, graphs: prev.graphs.filter((g) => g.id !== graphId) } : prev,
      );
      toast('Graph deleted', 'success');
    } catch {
      toast('Failed to delete graph', 'error');
    } finally {
      setDeletingGraph(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-1.5 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.displayName || user.username}</h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          disabled={user.role === 'admin'}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Delete User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary-400 mb-3">
              {(user.username ?? '?').charAt(0).toUpperCase()}
            </div>
            <h2 className="font-semibold">{user.displayName || user.username}</h2>
            {user.bio && <p className="text-xs text-muted-foreground mt-1">{user.bio}</p>}
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{user.email}</span>
              {user.emailVerified && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  verified
                </span>
              )}
            </div>
            {user.githubUsername && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Github className="w-4 h-4" />
                <span>{user.githubUsername}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4" />
              {editing ? (
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="text-xs px-2 py-1 rounded bg-surface-light border border-border text-foreground"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              ) : (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-surface-light'}`}
                >
                  {user.role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              {editing ? (
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="text-xs px-2 py-1 rounded bg-surface-light border border-border text-foreground"
                >
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                  <option value="enterprise">enterprise</option>
                </select>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-light">
                  {user.plan}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary-400 hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditRole(user.role);
                    setEditPlan(user.plan);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium hover:bg-surface-light text-muted-foreground transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary-400 hover:bg-primary/20 transition-colors"
              >
                Edit Role / Plan
              </button>
            )}
          </div>
        </Card>

        {/* Graphs + stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card>
              <p className="text-xs text-muted-foreground">Graphs</p>
              <p className="text-xl font-bold mt-1">{user.graphs.length}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground">Total Views</p>
              <p className="text-xl font-bold mt-1">{user.totalViews.toLocaleString()}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted-foreground">Total Nodes</p>
              <p className="text-xl font-bold mt-1">
                {user.graphs.reduce((s, g) => s + g._count.nodes, 0)}
              </p>
            </Card>
          </div>

          <Card>
            <h3 className="text-sm font-medium mb-3">Graphs</h3>
            {user.graphs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No graphs yet</p>
            ) : (
              <div className="space-y-2">
                {user.graphs.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-surface-light transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{g.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {g._count.nodes} nodes · {g.viewCount} views ·{' '}
                        {new Date(g.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/admin/graphs/${g.id}`}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary-400 hover:bg-primary/10 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteGraph(g.id)}
                        disabled={deletingGraph === g.id}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                      >
                        {deletingGraph === g.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${user.username}"? All graphs and data will be permanently removed.`}
        loading={deleting}
      />
    </div>
  );
}
