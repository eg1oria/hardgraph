'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BarChart3, BookTemplate, Eye, UserPlus, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/admin/StatCard';
import { AdminLineChart, AdminBarChart } from '@/components/admin/AdminChart';

interface Stats {
  usersCount: number;
  graphsCount: number;
  nodesCount: number;
  publicGraphsCount: number;
  profileViewsCount: number;
  templatesCount: number;
  viewsLast7d: number;
  viewsLast30d: number;
  newUsersToday: number;
  newUsersLast7d: number;
  activeUsersLast7d: number;
}

interface RecentUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
}

interface RecentGraph {
  id: string;
  title: string;
  createdAt: string;
  user: { username: string };
  _count: { nodes: number };
}

interface ChartPoint {
  date: string;
  count: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentGraphs, setRecentGraphs] = useState<RecentGraph[]>([]);
  const [viewsData, setViewsData] = useState<ChartPoint[]>([]);
  const [growthData, setGrowthData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/admin/stats'),
      api.get<RecentUser[]>('/admin/recent/users'),
      api.get<RecentGraph[]>('/admin/recent/graphs'),
      api.get<{ viewsPerDay: ChartPoint[] }>('/admin/analytics/summary'),
      api.get<ChartPoint[]>('/admin/analytics/user-growth'),
    ])
      .then(([s, ru, rg, analytics, growth]) => {
        setStats(s);
        setRecentUsers(ru);
        setRecentGraphs(rg);
        setViewsData(analytics.viewsPerDay);
        setGrowthData(growth);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and management</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.usersCount ?? null}
          icon={Users}
          color="text-blue-400"
          loading={loading}
        />
        <StatCard
          label="Total Graphs"
          value={stats?.graphsCount ?? null}
          icon={BarChart3}
          color="text-indigo-400"
          loading={loading}
        />
        <StatCard
          label="Templates"
          value={stats?.templatesCount ?? null}
          icon={BookTemplate}
          color="text-purple-400"
          loading={loading}
        />
        <StatCard
          label="Views (7d)"
          value={stats?.viewsLast7d ?? null}
          icon={Eye}
          color="text-amber-400"
          loading={loading}
        />
        <StatCard
          label="New Users Today"
          value={stats?.newUsersToday ?? null}
          icon={UserPlus}
          color="text-emerald-400"
          loading={loading}
        />
        <StatCard
          label="Active (7d)"
          value={stats?.activeUsersLast7d ?? null}
          icon={Activity}
          color="text-cyan-400"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-medium mb-4">Views — Last 30 Days</h2>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <AdminLineChart data={viewsData} />
          )}
        </Card>
        <Card>
          <h2 className="text-sm font-medium mb-4">New Users — Last 30 Days</h2>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <AdminBarChart data={growthData} />
          )}
        </Card>
      </div>

      {/* Recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Recent Users</h3>
            <Link href="/admin/users" className="text-xs text-primary-400 hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-surface-light transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary-400">
                    {(u.username ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Recent Graphs</h3>
            <Link href="/admin/graphs" className="text-xs text-primary-400 hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentGraphs.map((g) => (
                <Link
                  key={g.id}
                  href={`/admin/graphs/${g.id}`}
                  className="block p-2 -mx-2 rounded-lg hover:bg-surface-light transition-colors"
                >
                  <p className="text-sm font-medium truncate">{g.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {g.user.username} · {g._count.nodes} nodes ·{' '}
                    {new Date(g.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
