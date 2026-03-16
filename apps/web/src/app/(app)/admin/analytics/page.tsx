'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AdminLineChart, AdminBarChart } from '@/components/admin/AdminChart';
import { Eye, TrendingUp, Globe2, Link2 } from 'lucide-react';

interface ChartPoint {
  date: string;
  count: number;
}

interface TopGraph {
  id: string;
  title: string;
  viewCount: number;
  user: { username: string };
}

interface ReferrerItem {
  referrer: string;
  count: number;
}

interface CountryItem {
  country: string;
  count: number;
}

interface AnalyticsSummary {
  viewsPerDay: ChartPoint[];
  topGraphs: TopGraph[];
  topReferrers: ReferrerItem[];
  topCountries: CountryItem[];
}

export default function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [userGrowth, setUserGrowth] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<AnalyticsSummary>('/admin/analytics/summary'),
      api.get<ChartPoint[]>('/admin/analytics/user-growth'),
    ])
      .then(([s, g]) => {
        setSummary(s);
        setUserGrowth(g);
      })
      .catch(() => toast('Failed to load analytics', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Last 30 days overview</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-medium">Views per Day</h3>
          </div>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <AdminLineChart data={summary?.viewsPerDay ?? []} />
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-medium">New Users per Day</h3>
          </div>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <AdminBarChart data={userGrowth} />
          )}
        </Card>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Graphs */}
        <Card>
          <h3 className="text-sm font-medium mb-3">Top 10 Graphs by Views</h3>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !summary?.topGraphs.length ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-1">
              {summary.topGraphs.map((g, i) => (
                <div key={g.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-xs">{g.title}</p>
                    <p className="text-[10px] text-muted-foreground">{g.user.username}</p>
                  </div>
                  <span className="text-xs font-medium text-primary-400 shrink-0">
                    {g.viewCount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Referrers */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium">Top Referrers</h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !summary?.topReferrers.length ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-1">
              {summary.topReferrers.map((r) => (
                <div key={r.referrer} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground truncate flex-1 mr-2">
                    {r.referrer}
                  </span>
                  <span className="text-xs font-medium shrink-0">{r.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Countries */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Globe2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium">Top Countries</h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !summary?.topCountries.length ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-1">
              {summary.topCountries.map((c) => (
                <div key={c.country} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">{c.country}</span>
                  <span className="text-xs font-medium">{c.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
