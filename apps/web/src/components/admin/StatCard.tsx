'use client';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string | null;
  icon: LucideIcon;
  color: string;
  trend?: number | null;
  loading?: boolean;
  href?: string;
}

export function StatCard({ label, value, icon: Icon, color, trend, loading }: StatCardProps) {
  return (
    <Card>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('-400', '-500/10')}`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
          </p>
          {trend !== undefined && trend !== null && (
            <div className="flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : trend < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-400" />
              ) : (
                <Minus className="w-3 h-3 text-muted-foreground" />
              )}
              <span
                className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-muted-foreground'}`}
              >
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
              <span className="text-xs text-muted-foreground">vs prev period</span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
