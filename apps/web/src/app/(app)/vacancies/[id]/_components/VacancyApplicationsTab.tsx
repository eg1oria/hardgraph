'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import type { RecentApplication } from './types';
import { getScoreColor, getScoreBg, timeAgo } from './types';

interface VacancyApplicationsTabProps {
  vacancyId: string;
}

export function VacancyApplicationsTab({ vacancyId }: VacancyApplicationsTabProps) {
  const [recentApps, setRecentApps] = useState<RecentApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [totalApps, setTotalApps] = useState(0);

  useEffect(() => {
    api
      .get<RecentApplication[]>(`/vacancies/${vacancyId}/applications?sort=createdAt&order=desc`)
      .then((apps) => {
        setTotalApps(apps.length);
        setRecentApps(apps.slice(0, 5));
      })
      .catch(() => {
        // Silently fail — user can use the full dashboard
      })
      .finally(() => setLoadingApps(false));
  }, [vacancyId]);

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-400',
    reviewing: 'bg-blue-500/15 text-blue-400',
    shortlisted: 'bg-purple-500/15 text-purple-400',
    rejected: 'bg-red-500/15 text-red-400',
    accepted: 'bg-emerald-500/15 text-emerald-400',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalApps > 0
            ? `${totalApps} application${totalApps !== 1 ? 's' : ''} received`
            : 'Manage applications for this vacancy'}
        </p>
        <Link
          href={`/vacancies/${vacancyId}/applications`}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5" /> View All Applications
        </Link>
      </div>

      {loadingApps && (
        <div className="flex justify-center py-8">
          <Spinner size="md" className="text-primary" />
        </div>
      )}

      {!loadingApps && recentApps.length === 0 && (
        <div className="card text-center py-8">
          <Users className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted-foreground mb-3">No applications yet.</p>
          <Link href="/vacancies/analytics" className="text-sm text-primary hover:underline">
            HR Analytics
          </Link>
        </div>
      )}

      {!loadingApps && recentApps.length > 0 && (
        <div className="space-y-2">
          {recentApps.map((app) => (
            <div key={app.id} className="card flex items-center gap-3 py-3">
              <Avatar
                src={app.applicant.avatarUrl ?? undefined}
                fallback={app.applicant.displayName || app.applicant.username}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {app.applicant.displayName || app.applicant.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {app.graph.title} · {timeAgo(app.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className={`text-sm font-bold ${getScoreColor(app.matchScore)}`}>
                    {app.matchScore}%
                  </p>
                  <div className="w-16 h-1.5 rounded-full bg-surface-light overflow-hidden mt-0.5">
                    <div
                      className={`h-full rounded-full ${getScoreBg(app.matchScore)}`}
                      style={{ width: `${app.matchScore}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[app.status] ?? 'bg-surface-light text-muted-foreground'}`}
                >
                  {app.status}
                </span>
              </div>
            </div>
          ))}

          {totalApps > 5 && (
            <Link
              href={`/vacancies/${vacancyId}/applications`}
              className="flex items-center justify-center gap-1.5 text-sm text-primary hover:underline py-2"
            >
              View all {totalApps} applications <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href="/vacancies/analytics"
          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          HR Analytics <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
