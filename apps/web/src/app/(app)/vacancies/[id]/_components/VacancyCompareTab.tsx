'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search,
  Network,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ExternalLink,
  LogIn,
  Clock,
  Users,
  BarChart3,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { AiMatchCard } from './AiMatchCard';
import type { CompareResult, ApplicationItem, MyGraph } from './types';
import { LEVELS, getScoreColor, getScoreBg, timeAgo } from './types';

/* ─── Reusable: Level Dots ─────────────────────────── */
function LevelDots({
  candidateLevel,
  requiredLevel,
}: {
  candidateLevel: string | null;
  requiredLevel: string;
}) {
  const userIdx = candidateLevel ? LEVELS.indexOf(candidateLevel) : -1;
  const targetIdx = LEVELS.indexOf(requiredLevel);

  return (
    <div className="flex items-center gap-1">
      {LEVELS.map((level, i) => {
        const isUser = i <= userIdx;
        const isTarget = i <= targetIdx;
        let bg = 'bg-surface-light';
        if (isUser && isTarget) bg = 'bg-emerald-500';
        else if (isUser) bg = 'bg-cyan-500/50';
        else if (isTarget) bg = 'bg-red-500/40';
        return <div key={level} className={`w-2 h-2 rounded-full ${bg}`} title={level} />;
      })}
    </div>
  );
}

/* ─── Inline Compare Result block ──────────────────── */
function CompareResultBlock({ result, vacancyId }: { result: CompareResult; vacancyId: string }) {
  return (
    <div className="space-y-4 mt-4">
      {/* Summary mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center py-2">
          <CheckCircle2 className="w-4 h-4 mx-auto mb-0.5 text-emerald-500" />
          <p className="text-lg font-bold text-emerald-500">{result.matchedCount}</p>
          <p className="text-[10px] text-muted-foreground">Matched</p>
        </div>
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 text-center py-2">
          <AlertTriangle className="w-4 h-4 mx-auto mb-0.5 text-amber-500" />
          <p className="text-lg font-bold text-amber-500">{result.upgradeCount}</p>
          <p className="text-[10px] text-muted-foreground">Partial</p>
        </div>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-center py-2">
          <XCircle className="w-4 h-4 mx-auto mb-0.5 text-red-500" />
          <p className="text-lg font-bold text-red-500">{result.missingCount}</p>
          <p className="text-[10px] text-muted-foreground">Missing</p>
        </div>
        <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center py-2">
          <Sparkles className="w-4 h-4 mx-auto mb-0.5 text-cyan-500" />
          <p className="text-lg font-bold text-cyan-500">{result.bonusCount}</p>
          <p className="text-[10px] text-muted-foreground">Bonus</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {result.categoryBreakdown.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
            Category Breakdown
          </p>
          <div className="space-y-2">
            {result.categoryBreakdown.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium" style={{ color: cat.color }}>
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {cat.matched}/{cat.total} &middot; {cat.matchScore}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-light overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ backgroundColor: cat.color, width: `${cat.matchScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Detail */}
      <div>
        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
          Skills Detail
        </p>
        <div className="space-y-1.5">
          {result.skills.map((skill) => {
            const cfg = {
              matched: {
                border: 'border-l-emerald-500',
                badge: 'bg-emerald-500/15 text-emerald-400',
                label: 'Matched',
              },
              upgrade: {
                border: 'border-l-amber-500',
                badge: 'bg-amber-500/15 text-amber-400',
                label: 'Partial',
              },
              missing: {
                border: 'border-l-red-500',
                badge: 'bg-red-500/15 text-red-400',
                label: 'Missing',
              },
            }[skill.status];

            return (
              <div
                key={skill.name}
                className={`flex items-center justify-between py-1.5 px-3 rounded-lg bg-surface-light border-l-2 ${cfg.border}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium truncate">{skill.name}</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${cfg.badge}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {skill.candidateLevel ?? 'none'}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted" />
                  <span className="text-[10px] font-medium capitalize">{skill.requiredLevel}</span>
                  <LevelDots
                    candidateLevel={skill.candidateLevel}
                    requiredLevel={skill.requiredLevel}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bonus Skills */}
      {result.bonusSkills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
            Bonus Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.bonusSkills.map((skill) => (
              <span
                key={skill.name}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
              >
                {skill.name}
                <span className="ml-1 opacity-60">({skill.level})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Pitch Link */}
      <Link
        href={`/${result.candidateUsername}/${result.graphSlug}/pitch?vacancy=${vacancyId}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        View Interactive Pitch
      </Link>
    </div>
  );
}

/* ─── Props ────────────────────────────────────────── */
interface VacancyCompareTabProps {
  vacancyId: string;
  isOwner: boolean;
}

const STATUS_TABS = ['all', 'pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'];

const statusBadgeColors: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  reviewing: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  shortlisted: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  rejected: 'bg-red-500/15 text-red-500 border-red-500/30',
  accepted: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
};

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */
export function VacancyCompareTab({ vacancyId, isOwner }: VacancyCompareTabProps) {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  /* ─── Owner (HR) state ─────────────────────────────── */
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'matchScore' | 'createdAt'>('matchScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hrNoteInputs, setHrNoteInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Per-application compare results (lazy loaded)
  const [compareResults, setCompareResults] = useState<Record<string, CompareResult>>({});
  const [comparingId, setComparingId] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  /* ─── Candidate state ──────────────────────────────── */
  const [myGraphs, setMyGraphs] = useState<MyGraph[]>([]);
  const [loadingGraphs, setLoadingGraphs] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [comparing, setComparing] = useState(false);

  /* ─── AI state (candidate) ─────────────────────────── */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    algorithmicMatch: { matchScore: number; matchedCount: number; totalRequired: number };
    aiAnalysis: {
      aiMatchScore: number;
      verdict: 'strong_match' | 'good_match' | 'partial_match' | 'weak_match';
      summary: string;
      strengths: string[];
      improvements: { skill: string; tip: string }[];
      hrRecommendation: string;
      relatedSkills: string[];
    } | null;
  } | null>(null);

  /* ─── Fetch applications (owner) ──────────────────── */
  const fetchApplications = useCallback(
    (isInitial = false) => {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      if (isInitial) setLoadingApps(true);
      api
        .get<ApplicationItem[]>(
          `/vacancies/${vacancyId}/applications?sort=${sortField}&order=${sortOrder}${statusParam}`,
        )
        .then((data) => {
          setApplications(data);
          const notes: Record<string, string> = {};
          for (const a of data) notes[a.id] = a.hrNote ?? '';
          setHrNoteInputs(notes);
        })
        .catch(() => toast('Failed to load applications', 'error'))
        .finally(() => setLoadingApps(false));
    },
    [vacancyId, statusFilter, sortField, sortOrder, toast],
  );

  useEffect(() => {
    if (!isOwner) return;
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchApplications(true);
    } else {
      fetchApplications();
    }
  }, [isOwner, fetchApplications]);

  /* ─── Fetch graphs (candidate) ────────────────────── */
  useEffect(() => {
    if (isOwner || !user) return;
    setLoadingGraphs(true);
    api
      .get<MyGraph[]>('/graphs')
      .then(setMyGraphs)
      .catch(() => toast('Failed to load your graphs', 'error'))
      .finally(() => setLoadingGraphs(false));
  }, [isOwner, user, toast]);

  /* ─── Lazy-load compare result for an application ── */
  const loadCompareForApp = async (app: ApplicationItem) => {
    if (compareResults[app.id]) return; // already loaded
    setComparingId(app.id);
    try {
      const result = await api.get<CompareResult>(
        `/vacancies/${vacancyId}/compare/${app.graph.id}`,
      );
      setCompareResults((prev) => ({ ...prev, [app.id]: result }));
    } catch {
      toast('Failed to load comparison', 'error');
    } finally {
      setComparingId(null);
    }
  };

  /* ─── Toggle expand (owner) ────────────────────────── */
  const toggleExpand = (app: ApplicationItem) => {
    if (expandedId === app.id) {
      setExpandedId(null);
    } else {
      setExpandedId(app.id);
      loadCompareForApp(app);
    }
  };

  /* ─── Update application status (owner) ──────────── */
  const updateStatus = async (applicationId: string, status: string) => {
    setUpdatingId(applicationId);
    try {
      const updated = await api.patch<ApplicationItem>(
        `/vacancies/${vacancyId}/applications/${applicationId}`,
        { status, hrNote: hrNoteInputs[applicationId] || undefined },
      );
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, ...updated } : a)),
      );
      toast(`Status updated to ${status}`, 'success');
    } catch {
      toast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ─── Sort toggle (owner) ─────────────────────────── */
  const toggleSort = (field: 'matchScore' | 'createdAt') => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  /* ─── Candidate compare handler ────────────────────── */
  const handleCompare = async (graphId: string) => {
    setComparing(true);
    try {
      const result = await api.get<CompareResult>(`/vacancies/${vacancyId}/compare/${graphId}`);
      setCompareResult(result);
      setAiResult(null);
    } catch {
      toast('Failed to compare', 'error');
    } finally {
      setComparing(false);
    }
  };

  /* ─── AI Analysis handler (candidate) ──────────────── */
  const handleAiAnalyze = async () => {
    if (!compareResult) return;
    setAiLoading(true);
    try {
      const result = await api.post<typeof aiResult>(
        `/vacancies/${vacancyId}/ai-analyze/${compareResult.graphId}`,
      );
      setAiResult(result);
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode;
      if (status === 503) {
        toast('AI analysis is not available. Contact the administrator.', 'error');
      } else if (status === 429) {
        toast('Too many AI requests. Please wait a minute.', 'error');
      } else {
        toast('AI analysis failed. Try again later.', 'error');
      }
    } finally {
      setAiLoading(false);
    }
  };

  /* ─── Filtered applications (owner) ────────────────── */
  const filtered = applications.filter((app) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.applicant.username.toLowerCase().includes(q) ||
      app.applicant.displayName?.toLowerCase().includes(q) ||
      app.graph.title.toLowerCase().includes(q)
    );
  });

  /* ─── Summary stats (owner) ────────────────────────── */
  const totalApps = applications.length;
  const avgScore =
    totalApps > 0 ? Math.round(applications.reduce((s, a) => s + a.matchScore, 0) / totalApps) : 0;
  const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  /* ═══════════════════════════════════════════════════════
     Candidate: Compare Result View
     ═══════════════════════════════════════════════════════ */
  if (!isOwner && compareResult) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setCompareResult(null)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to graph selection
        </button>

        {/* Score + Candidate */}
        <div className="card flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <p className={`text-5xl font-bold ${getScoreColor(compareResult.matchScore)}`}>
              {compareResult.matchScore}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Match Score</p>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
              <Avatar
                src={compareResult.candidateAvatarUrl ?? undefined}
                fallback={compareResult.candidateDisplayName || compareResult.candidateUsername}
                size="md"
              />
              <div>
                <p className="font-semibold">
                  {compareResult.candidateDisplayName || compareResult.candidateUsername}
                </p>
                <p className="text-xs text-muted">@{compareResult.candidateUsername}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{compareResult.graphTitle}</span> &mdash;{' '}
              {compareResult.totalRequired} skills required &middot; {compareResult.matchedCount}{' '}
              matched &middot; {compareResult.upgradeCount} partial &middot;{' '}
              {compareResult.missingCount} missing
            </p>
            <Link
              href={`/${compareResult.candidateUsername}/${compareResult.graphSlug}/pitch?vacancy=${vacancyId}`}
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Interactive Pitch
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card border-emerald-500/20 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold text-emerald-500">{compareResult.matchedCount}</p>
            <p className="text-xs text-muted-foreground">Matched</p>
          </div>
          <div className="card border-amber-500/20 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-500">{compareResult.upgradeCount}</p>
            <p className="text-xs text-muted-foreground">Partial</p>
          </div>
          <div className="card border-red-500/20 text-center">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold text-red-500">{compareResult.missingCount}</p>
            <p className="text-xs text-muted-foreground">Missing</p>
          </div>
          <div className="card border-cyan-500/20 text-center">
            <Sparkles className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
            <p className="text-2xl font-bold text-cyan-500">{compareResult.bonusCount}</p>
            <p className="text-xs text-muted-foreground">Bonus</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {compareResult.categoryBreakdown.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {compareResult.categoryBreakdown.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: cat.color }}>
                      {cat.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cat.matched}/{cat.total} &middot; {cat.matchScore}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-light overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ backgroundColor: cat.color, width: `${cat.matchScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Detail */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Skills Detail</h3>
          <div className="space-y-2">
            {compareResult.skills.map((skill) => {
              const statusConfig = {
                matched: {
                  border: 'border-l-emerald-500',
                  badge: 'bg-emerald-500/15 text-emerald-400',
                  label: 'Matched',
                },
                upgrade: {
                  border: 'border-l-amber-500',
                  badge: 'bg-amber-500/15 text-amber-400',
                  label: 'Partial',
                },
                missing: {
                  border: 'border-l-red-500',
                  badge: 'bg-red-500/15 text-red-400',
                  label: 'Missing',
                },
              }[skill.status];

              return (
                <div
                  key={skill.name}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg bg-surface-light border-l-2 ${statusConfig.border}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium truncate">{skill.name}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${statusConfig.badge}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground capitalize">
                      {skill.candidateLevel ?? 'none'}
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted" />
                    <span className="text-xs font-medium capitalize">{skill.requiredLevel}</span>
                    <LevelDots
                      candidateLevel={skill.candidateLevel}
                      requiredLevel={skill.requiredLevel}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonus Skills */}
        {compareResult.bonusSkills.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Bonus Skills</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Additional skills this candidate has beyond the requirements.
            </p>
            <div className="flex flex-wrap gap-2">
              {compareResult.bonusSkills.map((skill) => (
                <span
                  key={skill.name}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                >
                  {skill.name}
                  <span className="ml-1 opacity-60">({skill.level})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAiAnalyze}
            disabled={aiLoading}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {aiLoading ? 'AI Analyzing...' : 'AI Analysis'}
          </button>
          {aiLoading && <Spinner size="sm" className="text-primary" />}
        </div>

        {aiResult?.aiAnalysis && (
          <AiMatchCard
            aiAnalysis={aiResult.aiAnalysis}
            algorithmicScore={aiResult.algorithmicMatch.matchScore}
          />
        )}

        {aiResult && !aiResult.aiAnalysis && (
          <div className="card text-center py-6">
            <p className="text-sm text-muted-foreground">
              AI analysis is not available. Contact the administrator.
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     Not logged in
     ═══════════════════════════════════════════════════════ */
  if (!user) {
    return (
      <div className="card text-center py-10">
        <LogIn className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
        <p className="text-sm text-muted-foreground mb-3">
          Log in to compare your skills against this vacancy.
        </p>
        <Link href="/auth/login" className="btn-primary text-sm">
          Log In
        </Link>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     Owner: Compare & Applications (merged)
     ═══════════════════════════════════════════════════════ */
  if (isOwner) {
    return (
      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card text-center py-3">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalApps}</p>
            <p className="text-[10px] text-muted-foreground">Total Applications</p>
          </div>
          <div className="card text-center py-3">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}%</p>
            <p className="text-[10px] text-muted-foreground">Avg Match Score</p>
          </div>
          <div className="card text-center py-3">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold text-emerald-500">
              {(statusCounts['accepted'] || 0) + (statusCounts['shortlisted'] || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Shortlisted / Accepted</p>
          </div>
          <div className="card text-center py-3">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-500">
              {(statusCounts['pending'] || 0) + (statusCounts['reviewing'] || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Pending / Reviewing</p>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-2 text-xs font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px ${
                statusFilter === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {tab !== 'all' && statusCounts[tab] ? (
                <span className="ml-1 opacity-60">({statusCounts[tab]})</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Search + Sort controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by name or graph title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => toggleSort('matchScore')}
              className={`text-xs flex items-center gap-1 transition-colors ${sortField === 'matchScore' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Match Score
              {sortField === 'matchScore' &&
                (sortOrder === 'desc' ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                ))}
            </button>
            <button
              onClick={() => toggleSort('createdAt')}
              className={`text-xs flex items-center gap-1 transition-colors ${sortField === 'createdAt' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Date
              {sortField === 'createdAt' &&
                (sortOrder === 'desc' ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                ))}
            </button>
            <Link
              href={`/vacancies/${vacancyId}/analytics`}
              className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto"
            >
              <BarChart3 className="w-3 h-3" /> Analytics
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loadingApps && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-primary" />
          </div>
        )}

        {/* Empty */}
        {!loadingApps && filtered.length === 0 && (
          <div className="card text-center py-12">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
            <p className="text-sm text-muted-foreground">
              {applications.length === 0
                ? 'No applications yet. Candidates who apply will appear here.'
                : 'No applications match your filters.'}
            </p>
          </div>
        )}

        {/* Application list */}
        {!loadingApps && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((app) => {
              const isExpanded = expandedId === app.id;
              const appCompare = compareResults[app.id];
              const isLoadingCompare = comparingId === app.id;

              return (
                <div key={app.id} className="card transition-all duration-300">
                  {/* Collapsed row */}
                  <button
                    onClick={() => toggleExpand(app)}
                    className="w-full flex items-center gap-4 text-left"
                  >
                    <Avatar
                      src={app.applicant.avatarUrl ?? undefined}
                      fallback={app.applicant.displayName || app.applicant.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {app.applicant.displayName || app.applicant.username}
                      </p>
                      <p className="text-xs text-muted truncate">
                        @{app.applicant.username} &middot; {app.graph.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 w-32">
                        <div className="flex-1 h-2 rounded-full bg-surface-light overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${getScoreBg(app.matchScore)}`}
                            style={{ width: `${app.matchScore}%` }}
                          />
                        </div>
                        <span
                          className={`text-sm font-bold w-10 text-right ${getScoreColor(app.matchScore)}`}
                        >
                          {app.matchScore}%
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-1 rounded-full border capitalize ${statusBadgeColors[app.status] ?? 'bg-surface-light text-muted-foreground'}`}
                      >
                        {app.status}
                      </span>
                      <span className="text-xs text-muted hidden sm:block">
                        {timeAgo(app.createdAt)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {/* Score + Graph summary */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="text-center sm:text-left">
                          <p className={`text-4xl font-bold ${getScoreColor(app.matchScore)}`}>
                            {app.matchScore}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {app.matchedSkills}/{app.totalRequired} skills matched
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Graph:</span>{' '}
                            {app.graph.title}
                          </p>
                          {app.reviewedAt && (
                            <p className="text-xs text-muted mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Reviewed{' '}
                              {new Date(app.reviewedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Inline compare result */}
                      {isLoadingCompare && (
                        <div className="flex items-center justify-center py-6">
                          <Spinner size="md" className="text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading skill comparison...
                          </span>
                        </div>
                      )}
                      {appCompare && (
                        <CompareResultBlock result={appCompare} vacancyId={vacancyId} />
                      )}

                      {/* Cover Letter */}
                      {app.coverLetter && (
                        <div>
                          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                            Cover Letter
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-surface-light rounded-lg p-3">
                            {app.coverLetter}
                          </p>
                        </div>
                      )}

                      {/* HR Note */}
                      <div>
                        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                          HR Note
                        </p>
                        <textarea
                          value={hrNoteInputs[app.id] ?? ''}
                          onChange={(e) =>
                            setHrNoteInputs((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          maxLength={1000}
                          rows={2}
                          placeholder="Add a note about this candidate..."
                          className="input-field w-full resize-none text-sm"
                        />
                      </div>

                      {/* Status action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => updateStatus(app.id, 'reviewing')}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-500 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                          >
                            {updatingId === app.id ? <Spinner size="sm" /> : 'Start Review'}
                          </button>
                        )}
                        {(app.status === 'pending' || app.status === 'reviewing') && (
                          <button
                            onClick={() => updateStatus(app.id, 'shortlisted')}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-500 border border-purple-500/30 hover:bg-purple-500/25 transition-colors"
                          >
                            Shortlist
                          </button>
                        )}
                        {app.status !== 'accepted' && app.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(app.id, 'accepted')}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                          >
                            Accept
                          </button>
                        )}
                        {app.status !== 'rejected' && app.status !== 'accepted' && (
                          <button
                            onClick={() => updateStatus(app.id, 'rejected')}
                            disabled={updatingId === app.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     Candidate: Graph Selection
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select one of your graphs to see how your skills match this vacancy.
      </p>

      {loadingGraphs && (
        <div className="flex justify-center py-8">
          <Spinner size="md" className="text-primary" />
        </div>
      )}

      {!loadingGraphs && myGraphs.length === 0 && (
        <div className="card text-center py-8">
          <Network className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted-foreground mb-3">
            You don&apos;t have any graphs yet. Create one to compare your skills.
          </p>
          <Link href="/dashboard" className="btn-primary text-sm">
            Create Graph
          </Link>
        </div>
      )}

      {!loadingGraphs && myGraphs.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {myGraphs.map((graph) => (
            <button
              key={graph.id}
              onClick={() => handleCompare(graph.id)}
              disabled={comparing}
              className="card text-left hover:border-border-light transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Network className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm font-semibold truncate">{graph.title}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{graph._count.nodes} skills</span>
                {!graph.isPublic && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                    Private
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {comparing && (
        <div className="fixed inset-0 bg-background/60 flex items-center justify-center z-50">
          <div className="card flex items-center gap-3">
            <Spinner size="md" className="text-primary" />
            <span className="text-sm">Comparing skills...</span>
          </div>
        </div>
      )}
    </div>
  );
}
