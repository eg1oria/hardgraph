'use client';

import Link from 'next/link';

interface AiHrAnalysis {
  overallAssessment: string;
  ranking: {
    username: string;
    aiScore: number;
    reason: string;
  }[];
  hiringAdvice: string;
  skillGapInsight: string;
  suggestedInterviewQuestions: string[];
}

interface AiHrAdvisorCardProps {
  analysis: AiHrAnalysis;
}

function getAiScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 35) return 'text-amber-400';
  return 'text-red-400';
}

function getAiScoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 35) return 'bg-amber-500';
  return 'bg-red-500';
}

export function AiHrAdvisorCard({ analysis }: AiHrAdvisorCardProps) {
  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-purple-500/20 flex items-center gap-2">
        <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          AI HR Advisor
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Overall Assessment */}
        <div className="rounded-lg bg-surface-light border border-border p-4">
          <div className="flex items-start gap-2">
            <span className="text-sm shrink-0">📊</span>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Overall Assessment</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.overallAssessment}
              </p>
            </div>
          </div>
        </div>

        {/* AI Ranking */}
        {analysis.ranking.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
              AI Candidate Ranking
            </p>
            <div className="space-y-2">
              {analysis.ranking.map((candidate, i) => (
                <div
                  key={candidate.username}
                  className="flex items-center gap-3 rounded-lg bg-surface-light border border-border p-3"
                >
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center shrink-0">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link
                        href={`/${candidate.username}`}
                        className="text-sm font-medium text-primary hover:underline truncate"
                      >
                        @{candidate.username}
                      </Link>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-16 h-1.5 rounded-full bg-surface overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getAiScoreBg(candidate.aiScore)}`}
                            style={{ width: `${candidate.aiScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${getAiScoreColor(candidate.aiScore)}`}>
                          {candidate.aiScore}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{candidate.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hiring Advice */}
        <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-3">
          <div className="flex items-start gap-2">
            <span className="text-sm shrink-0">💼</span>
            <div>
              <p className="text-xs font-medium text-cyan-400 mb-1">Hiring Advice</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {analysis.hiringAdvice}
              </p>
            </div>
          </div>
        </div>

        {/* Skill Gap Insight */}
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
          <div className="flex items-start gap-2">
            <span className="text-sm shrink-0">🔍</span>
            <div>
              <p className="text-xs font-medium text-amber-400 mb-1">Skill Gap Insight</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {analysis.skillGapInsight}
              </p>
            </div>
          </div>
        </div>

        {/* Interview Questions */}
        {analysis.suggestedInterviewQuestions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Suggested Interview Questions
            </p>
            <ol className="space-y-2">
              {analysis.suggestedInterviewQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 text-primary font-medium">🎯 {i + 1}.</span>
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
