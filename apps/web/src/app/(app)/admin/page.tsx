'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BarChart3, Boxes, Globe, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface Stats {
  usersCount: number;
  graphsCount: number;
  nodesCount: number;
  publicGraphsCount: number;
  profileViewsCount: number;
}

const statCards = [
  { key: 'usersCount', label: 'Users', icon: Users, color: 'text-blue-400', href: '/admin/users' },
  {
    key: 'graphsCount',
    label: 'Graphs',
    icon: BarChart3,
    color: 'text-indigo-400',
    href: '/admin/graphs',
  },
  { key: 'nodesCount', label: 'Nodes', icon: Boxes, color: 'text-purple-400', href: null },
  {
    key: 'publicGraphsCount',
    label: 'Public Graphs',
    icon: Globe,
    color: 'text-emerald-400',
    href: null,
  },
  { key: 'profileViewsCount', label: 'Views', icon: Eye, color: 'text-amber-400', href: null },
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Stats>('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.key} className="relative">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                </div>
                <p className="text-2xl font-bold">{stats?.[card.key]?.toLocaleString() ?? '—'}</p>
                {card.href && (
                  <Link
                    href={card.href}
                    className="absolute inset-0 rounded-xl"
                    aria-label={`View ${card.label}`}
                  />
                )}
              </>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/users">
          <Card hover className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-xs text-muted-foreground">View and manage all users</p>
            </div>
          </Card>
        </Link>
        <Link href="/admin/graphs">
          <Card hover className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-medium">Manage Graphs</h3>
              <p className="text-xs text-muted-foreground">View and manage all graphs</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
