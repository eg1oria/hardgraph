'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  Network,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import type { PublicGraph, CompareResult } from './types';
import { LEVELS, getScoreColor } from './types';

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

interface VacancyCompareTabProps {
  vacancyId: string;
}

export function VacancyCompareTab({ vacancyId }: VacancyCompareTabProps) {
  const { toast } = useToast();
  const [graphSearch, setGraphSearch] = useState('');
  const [publicGraphs, setPublicGraphs] = useState<PublicGraph[]>([]);
  const [loadingGraphs, setLoadingGraphs] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [comparing, setComparing] = useState(false);

  const searchGraphs = useCallback(async () => {
    setLoadingGraphs(true);
    try {
      const graphs = await api.get<PublicGraph[]>('/graphs/explore?limit=50');
      setPublicGraphs(graphs);
    } catch {
      toast('Failed to load graphs', 'error');
    } finally {
      setLoadingGraphs(false);
    }
  }, [toast]);

  useEffect(() => {
    if (publicGraphs.length === 0) searchGraphs();
  }, []);

  const filteredGraphs = publicGraphs.filter((g) => {
    if (!graphSearch) return true;
    const q = graphSearch.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.user.username.toLowerCase().includes(q) ||
      g.user.displayName?.toLowerCase().includes(q) ||
      g.field?.toLowerCase().includes(q)
    );
  });

  const handleCompare = async (graphId: string) => {
    setComparing(true);
    try {
      const result = await api.get<CompareResult>(`/vacancies/${vacancyId}/compare/${graphId}`);
      setCompareResult(result);
    } catch {
      toast('Failed to compare', 'error');
    } finally {
      setComparing(false);
    }
  };

  if (compareResult) {
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select a candidate&apos;s skill graph to compare against this vacancy&apos;s requirements.
      </p>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search graphs by title or username..."
          value={graphSearch}
          onChange={(e) => setGraphSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {loadingGraphs && (
        <div className="flex justify-center py-8">
          <Spinner size="md" className="text-primary" />
        </div>
      )}

      {!loadingGraphs && filteredGraphs.length === 0 && (
        <div className="card text-center py-8">
          <Network className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted-foreground">No public graphs found.</p>
        </div>
      )}

      {!loadingGraphs && filteredGraphs.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredGraphs.map((graph) => (
            <button
              key={graph.id}
              onClick={() => handleCompare(graph.id)}
              disabled={comparing}
              className="card text-left hover:border-border-light transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Avatar
                  src={graph.user.avatarUrl ?? undefined}
                  fallback={graph.user.displayName || graph.user.username}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {graph.user.displayName || graph.user.username}
                  </p>
                  <p className="text-xs text-muted">@{graph.user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Network className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-sm font-medium truncate">{graph.title}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{graph._count.nodes} skills</span>
                {graph.field && <Badge variant="muted">{graph.field}</Badge>}
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
