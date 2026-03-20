'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';

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

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreBarBg(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function AiHrAdvisorCard({ analysis }: AiHrAdvisorCardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ranking: true,
    advice: false,
    gap: false,
    questions: false,
  });

  const toggle = (key: string) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">AI HR Advisor</span>
        <span className="text-xs text-muted-foreground">
          {analysis.ranking.length} candidate{analysis.ranking.length !== 1 ? 's' : ''} analyzed
        </span>
      </div>

      <div className="p-4 space-y-0">
        {/* Overall Assessment — always visible */}
        <div className="pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Overall Assessment
          </p>
          <p className="text-sm text-foreground leading-relaxed">{analysis.overallAssessment}</p>
        </div>

        {/* Candidate Ranking — collapsible, open by default */}
        {analysis.ranking.length > 0 && (
          <div className="border-t border-border pt-3 pb-4">
            <button
              onClick={() => toggle('ranking')}
              className="w-full flex items-center justify-between mb-3"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Candidate Ranking
              </p>
              {expandedSections.ranking ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
            {expandedSections.ranking && (
              <div className="space-y-3">
                {analysis.ranking.map((candidate, i) => (
                  <div key={candidate.username} className="flex items-start gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-5 text-right shrink-0 pt-0.5">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/${candidate.username}`}
                          className="text-sm font-medium text-foreground hover:underline"
                        >
                          @{candidate.username}
                        </Link>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getScoreBarBg(candidate.aiScore)}`}
                              style={{ width: `${candidate.aiScore}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${getScoreColor(candidate.aiScore)}`}
                          >
                            {candidate.aiScore}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {candidate.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hiring Advice — collapsible */}
        <div className="border-t border-border pt-3 pb-4">
          <button
            onClick={() => toggle('advice')}
            className="w-full flex items-center justify-between"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Hiring Advice
            </p>
            {expandedSections.advice ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          {expandedSections.advice && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              {analysis.hiringAdvice}
            </p>
          )}
        </div>

        {/* Skill Gap Insight — collapsible */}
        <div className="border-t border-border pt-3 pb-4">
          <button
            onClick={() => toggle('gap')}
            className="w-full flex items-center justify-between"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Skill Gap Insight
            </p>
            {expandedSections.gap ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          {expandedSections.gap && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              {analysis.skillGapInsight}
            </p>
          )}
        </div>

        {/* Interview Questions — collapsible */}
        {analysis.suggestedInterviewQuestions.length > 0 && (
          <div className="border-t border-border pt-3">
            <button
              onClick={() => toggle('questions')}
              className="w-full flex items-center justify-between"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Interview Questions
                <span className="ml-1.5 normal-case tracking-normal font-normal">
                  ({analysis.suggestedInterviewQuestions.length})
                </span>
              </p>
              {expandedSections.questions ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
            {expandedSections.questions && (
              <ol className="space-y-2 mt-2">
                {analysis.suggestedInterviewQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="shrink-0 text-foreground font-medium w-5 text-right">
                      {i + 1}.
                    </span>
                    <span className="leading-relaxed">{q}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
