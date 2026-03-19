'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  Briefcase,
  BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

interface OverviewAnalytics {
  totalVacancies: number;
  activeVacancies: number;
  totalApplications: number;
  pendingApplications: number;
  averageMatchScore: number;
  acceptanceRate: number;
  topVacanciesByApplications: {
    vacancyId: string;
    title: string;
    company: string | null;
    applicationsCount: number;
    avgMatchScore: number;
  }[];
  statusOverview: { status: string; count: number; percentage: number }[];
  recentApplications: {
    id: string;
    vacancyTitle: string;
    applicantUsername: string;
    matchScore: number;
    status: string;
    createdAt: string;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  reviewing: '#3b82f6',
  shortlisted: '#a855f7',
  rejected: '#ef4444',
  accepted: '#10b981',
};

const STATUS_BG: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-500',
  reviewing: 'bg-blue-500/15 text-blue-500',
  shortlisted: 'bg-purple-500/15 text-purple-500',
  rejected: 'bg-red-500/15 text-red-500',
  accepted: 'bg-emerald-500/15 text-emerald-500',
};

function getScoreColor(score: number) {
  if (score >= 76) return 'text-emerald-400';
  if (score >= 51) return 'text-yellow-400';
  if (score >= 26) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreCSSColor(score: number) {
  if (score >= 76) return '#10b981';
  if (score >= 51) return '#eab308';
  if (score >= 26) return '#f59e0b';
  return '#ef4444';
}

export default function HRAnalyticsDashboard() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<OverviewAnalytics>('/applications/analytics/overview')
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) toast('Failed to load analytics', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Failed to load analytics data.</p>
      </div>
    );
  }

  const pipelineStatuses = ['pending', 'reviewing', 'shortlisted', 'accepted', 'rejected'];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/vacancies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Vacancies
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">HR Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of all your vacancies and applications
          </p>
        </div>
        <Link href="/applications" className="text-sm text-primary hover:underline">
          My Applications
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Total Applications</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{overview.totalApplications}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Target className="w-4 h-4 text-cyan-500" />
            </div>
            <span className="text-xs text-muted-foreground">Avg Match Score</span>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-bold ${getScoreColor(overview.averageMatchScore)}`}
          >
            {overview.averageMatchScore}%
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-surface-light overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${overview.averageMatchScore}%`,
                backgroundColor: getScoreCSSColor(overview.averageMatchScore),
              }}
            />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xs text-muted-foreground">Acceptance Rate</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
            {overview.acceptanceRate}%
          </p>
          {/* Mini donut */}
          <div className="mt-2 flex justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeDasharray={`${overview.acceptanceRate * 1.13} 113`}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
                className="transition-all duration-700"
              />
            </svg>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs text-muted-foreground">Pending Review</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400">
            {overview.pendingApplications}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Application Pipeline */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Application Pipeline
          </h3>
          <div className="space-y-3">
            {pipelineStatuses.map((status) => {
              const item = overview.statusOverview.find((s) => s.status === status);
              const count = item?.count ?? 0;
              const pct = item?.percentage ?? 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm capitalize" style={{ color: STATUS_COLORS[status] }}>
                      {status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-surface-light overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: STATUS_COLORS[status],
                        minWidth: count > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {/* Stacked bar summary */}
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Pipeline Overview</p>
              <div className="h-6 rounded-full overflow-hidden flex">
                {pipelineStatuses.map((status) => {
                  const item = overview.statusOverview.find((s) => s.status === status);
                  const pct = item?.percentage ?? 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={status}
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: STATUS_COLORS[status],
                      }}
                      title={`${status}: ${pct}%`}
                    />
                  );
                })}
                {overview.totalApplications === 0 && (
                  <div className="h-full w-full bg-surface-light" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vacancies Overview */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" /> Vacancies Overview
          </h3>
          <div className="text-xs text-muted-foreground mb-3">
            {overview.totalVacancies} total &middot; {overview.activeVacancies} active
          </div>
          {overview.topVacanciesByApplications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No vacancies yet.</p>
          ) : (
            <div className="space-y-3">
              {overview.topVacanciesByApplications.map((v) => (
                <Link
                  key={v.vacancyId}
                  href={`/vacancies/${v.vacancyId}/applications`}
                  className="block p-3 rounded-lg bg-surface-light hover:bg-surface-light/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{v.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {v.applicationsCount} apps
                    </span>
                  </div>
                  {v.company && <p className="text-xs text-muted mb-2">{v.company}</p>}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${v.avgMatchScore}%`,
                          backgroundColor: getScoreCSSColor(v.avgMatchScore),
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getScoreColor(v.avgMatchScore)}`}>
                      {v.avgMatchScore}% avg
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="card mb-8">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Recent Applications
        </h3>
        {overview.recentApplications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wider border-b border-border">
                  <th className="pb-2 pr-4">Vacancy</th>
                  <th className="pb-2 pr-4">Applicant</th>
                  <th className="pb-2 pr-4">Match</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentApplications.map((app) => (
                  <tr key={app.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4 font-medium truncate max-w-[200px]">
                      {app.vacancyTitle}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">@{app.applicantUsername}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`font-bold ${getScoreColor(app.matchScore)}`}>
                        {app.matchScore}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BG[app.status] ?? ''}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-muted">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
