'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Target, Clock, TrendingUp, Brain } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { AiHrAdvisorCard } from '../_components/AiHrAdvisorCard';

interface VacancyAnalytics {
  totalApplications: number;
  statusBreakdown: { status: string; count: number; percentage: number }[];
  averageMatchScore: number;
  matchScoreDistribution: { range: string; count: number; percentage: number }[];
  topCandidates: {
    applicantId: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    matchScore: number;
    graphTitle: string;
    status: string;
  }[];
  skillGapAnalysis: {
    skillName: string;
    matchedCount: number;
    totalApplications: number;
    matchPercentage: number;
  }[];
  applicationTimeline: { date: string; count: number }[];
  averageTimeToReview: number | null;
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

const SCORE_RANGE_COLORS: Record<string, string> = {
  '0-25%': '#ef4444',
  '26-50%': '#f59e0b',
  '51-75%': '#eab308',
  '76-100%': '#10b981',
};

function getScoreColor(score: number) {
  if (score >= 76) return 'text-emerald-400';
  if (score >= 51) return 'text-yellow-400';
  if (score >= 26) return 'text-amber-400';
  return 'text-red-400';
}

function getSkillGapColor(pct: number) {
  if (pct >= 70) return '#10b981';
  if (pct >= 40) return '#eab308';
  return '#ef4444';
}

// Pure SVG line chart
function TimelineChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) return null;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const width = 600;
  const height = 180;
  const padding = { top: 15, right: 15, bottom: 28, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1 || 1)) * chartW,
    y: padding.top + chartH - (d.count / maxCount) * chartH,
    date: d.date,
    count: d.count,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? 0} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;
  const yTicks = [0, Math.ceil(maxCount / 2), maxCount];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      {yTicks.map((tick) => {
        const y = padding.top + chartH - (tick / maxCount) * chartH;
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 3"
            />
            <text
              x={padding.left - 6}
              y={y + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.4)"
              fontSize="10"
            >
              {tick}
            </text>
          </g>
        );
      })}
      <path d={areaD} fill="url(#aGrad)" opacity="0.3" />
      <path d={pathD} fill="none" stroke="#818CF8" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#818CF8" stroke="#1e1e2e" strokeWidth="1.5">
          <title>{`${p.date}: ${p.count}`}</title>
        </circle>
      ))}
      {points
        .filter((_, i) => i % 7 === 0 || i === points.length - 1)
        .map((p) => (
          <text
            key={p.date}
            x={p.x}
            y={height - 4}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="9"
          >
            {new Date(p.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </text>
        ))}
      <defs>
        <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function VacancyAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const vacancyId = params.id;

  const [analytics, setAnalytics] = useState<VacancyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  /* ─── AI Insights state ────────────────────────────── */
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    overallAssessment: string;
    ranking: { username: string; aiScore: number; reason: string }[];
    hiringAdvice: string;
    skillGapInsight: string;
    suggestedInterviewQuestions: string[];
  } | null>(null);

  const handleGetAiInsights = async () => {
    setAiInsightsLoading(true);
    try {
      const result = await api.post<typeof aiInsights>(
        `/vacancies/${vacancyId}/applications/ai-hr-analyze`,
      );
      setAiInsights(result);
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 503) {
        toast('AI analysis is not available. Contact the administrator.', 'error');
      } else if (status === 429) {
        toast('Too many AI requests. Please wait a minute.', 'error');
      } else {
        toast('AI insights failed. Try again later.', 'error');
      }
    } finally {
      setAiInsightsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get<VacancyAnalytics>(`/vacancies/${vacancyId}/analytics`)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
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
  }, [vacancyId, toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Failed to load analytics.</p>
      </div>
    );
  }

  const pipelineStatuses = ['pending', 'reviewing', 'shortlisted', 'accepted', 'rejected'];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href={`/vacancies/${vacancyId}/applications`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold mb-8">Vacancy Analytics</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Applicants</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{analytics.totalApplications}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Target className="w-4 h-4 text-cyan-500" />
            </div>
            <span className="text-xs text-muted-foreground">Avg Match</span>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-bold ${getScoreColor(analytics.averageMatchScore)}`}
          >
            {analytics.averageMatchScore}%
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs text-muted-foreground">Avg Review Time</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">
            {analytics.averageTimeToReview !== null ? `${analytics.averageTimeToReview}h` : '—'}
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xs text-muted-foreground">Pipeline</span>
          </div>
          <div className="h-4 rounded-full overflow-hidden flex mt-2">
            {pipelineStatuses.map((status) => {
              const item = analytics.statusBreakdown.find((s) => s.status === status);
              const pct = item?.percentage ?? 0;
              if (pct === 0) return null;
              return (
                <div
                  key={status}
                  className="h-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }}
                  title={`${status}: ${pct}%`}
                />
              );
            })}
            {analytics.totalApplications === 0 && (
              <div className="h-full w-full bg-surface-light" />
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Pipeline Breakdown */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Application Pipeline</h3>
          <div className="space-y-3">
            {pipelineStatuses.map((status) => {
              const item = analytics.statusBreakdown.find((s) => s.status === status);
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
          </div>
        </div>

        {/* Match Score Distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Match Score Distribution</h3>
          <div className="space-y-3">
            {analytics.matchScoreDistribution.map((dist) => (
              <div key={dist.range}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: SCORE_RANGE_COLORS[dist.range] }}>
                    {dist.range}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dist.count} ({dist.percentage}%)
                  </span>
                </div>
                <div className="h-4 rounded bg-surface-light overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-700"
                    style={{
                      width: `${dist.percentage}%`,
                      backgroundColor: SCORE_RANGE_COLORS[dist.range],
                      minWidth: dist.count > 0 ? '4px' : '0',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card mb-8">
        <h3 className="text-sm font-semibold mb-4">Applications Timeline (30 days)</h3>
        <TimelineChart data={analytics.applicationTimeline} />
      </div>

      {/* Skill Gap Analysis */}
      {analytics.skillGapAnalysis.length > 0 && (
        <div className="card mb-8">
          <h3 className="text-sm font-semibold mb-4">Skill Gap Analysis</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Percentage of applicants who have each required skill
          </p>
          <div className="space-y-3">
            {analytics.skillGapAnalysis.map((skill) => (
              <div key={skill.skillName}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{skill.skillName}</span>
                  <span className="text-xs text-muted-foreground">
                    {skill.matchedCount}/{skill.totalApplications} ({skill.matchPercentage}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface-light overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${skill.matchPercentage}%`,
                      backgroundColor: getSkillGapColor(skill.matchPercentage),
                      minWidth: skill.matchedCount > 0 ? '4px' : '0',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Candidates */}
      {analytics.topCandidates.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Top Candidates</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wider border-b border-border">
                  <th className="pb-2 pr-4">Candidate</th>
                  <th className="pb-2 pr-4">Match</th>
                  <th className="pb-2 pr-4">Graph</th>
                  <th className="pb-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCandidates.map((c) => (
                  <tr key={c.applicantId} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={c.avatarUrl ?? undefined}
                          fallback={c.displayName || c.username}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-sm">{c.displayName || c.username}</p>
                          <p className="text-xs text-muted">@{c.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`font-bold ${getScoreColor(c.matchScore)}`}>
                        {c.matchScore}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{c.graphTitle}</td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_BG[c.status] ?? ''}`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights Section */}
      {analytics.totalApplications > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">AI Insights</h3>
            {!aiInsights && (
              <button
                onClick={handleGetAiInsights}
                disabled={aiInsightsLoading}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                {aiInsightsLoading ? 'Analyzing...' : 'Get AI Insights'}
              </button>
            )}
          </div>
          {aiInsightsLoading && (
            <div className="flex justify-center py-8">
              <Spinner size="lg" className="text-primary" />
            </div>
          )}
          {aiInsights && <AiHrAdvisorCard analysis={aiInsights} />}
        </div>
      )}
    </div>
  );
}
