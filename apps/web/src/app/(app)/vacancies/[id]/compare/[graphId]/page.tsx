'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

interface CompareResult {
  vacancyId: string;
  vacancyTitle: string;
  graphId: string;
  graphTitle: string;
  candidateUsername: string;
  candidateDisplayName: string | null;
  candidateAvatarUrl: string | null;
  matchScore: number;
  totalRequired: number;
  matchedCount: number;
  upgradeCount: number;
  missingCount: number;
  bonusCount: number;
  skills: {
    name: string;
    category?: string;
    categoryColor?: string;
    candidateLevel: string | null;
    requiredLevel: string;
    status: 'matched' | 'upgrade' | 'missing';
  }[];
  bonusSkills: { name: string; level: string; category?: string }[];
  categoryBreakdown: {
    name: string;
    color: string;
    matchScore: number;
    matched: number;
    total: number;
  }[];
}

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

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

function getScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

export default function CompareResultPage() {
  const params = useParams<{ id: string; graphId: string }>();
  const { toast } = useToast();
  const vacancyId = params.id;
  const graphId = params.graphId;

  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<CompareResult>(`/vacancies/${vacancyId}/compare/${graphId}`)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) toast('Failed to load comparison', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vacancyId, graphId, toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="mb-3">Comparison not available</p>
        <Link href={`/vacancies/${vacancyId}`} className="text-sm text-primary hover:underline">
          Back to vacancy
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href={`/vacancies/${vacancyId}/applications`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold mb-6">Skill Comparison</h1>

      <div className="space-y-6">
        {/* Score + Candidate */}
        <div className="card flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <p className={`text-5xl font-bold ${getScoreColor(result.matchScore)}`}>
              {result.matchScore}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Match Score</p>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
              <Avatar
                src={result.candidateAvatarUrl ?? undefined}
                fallback={result.candidateDisplayName || result.candidateUsername}
                size="md"
              />
              <div>
                <p className="font-semibold">
                  {result.candidateDisplayName || result.candidateUsername}
                </p>
                <p className="text-xs text-muted">@{result.candidateUsername}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{result.graphTitle}</span> &mdash;{' '}
              {result.totalRequired} skills required &middot; {result.matchedCount} matched &middot;{' '}
              {result.upgradeCount} partial &middot; {result.missingCount} missing
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card border-emerald-500/20 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold text-emerald-500">{result.matchedCount}</p>
            <p className="text-xs text-muted-foreground">Matched</p>
          </div>
          <div className="card border-amber-500/20 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-500">{result.upgradeCount}</p>
            <p className="text-xs text-muted-foreground">Partial</p>
          </div>
          <div className="card border-red-500/20 text-center">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold text-red-500">{result.missingCount}</p>
            <p className="text-xs text-muted-foreground">Missing</p>
          </div>
          <div className="card border-cyan-500/20 text-center">
            <Sparkles className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
            <p className="text-2xl font-bold text-cyan-500">{result.bonusCount}</p>
            <p className="text-xs text-muted-foreground">Bonus</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {result.categoryBreakdown.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Category Breakdown</h3>
            <div className="space-y-3">
              {result.categoryBreakdown.map((cat) => (
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
                      style={{
                        backgroundColor: cat.color,
                        width: `${cat.matchScore}%`,
                      }}
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
            {result.skills.map((skill) => {
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
        {result.bonusSkills.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Bonus Skills</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Additional skills this candidate has beyond the requirements.
            </p>
            <div className="flex flex-wrap gap-2">
              {result.bonusSkills.map((skill) => (
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
      </div>
    </div>
  );
}
