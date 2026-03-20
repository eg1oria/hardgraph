'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, ArrowUpRight } from 'lucide-react';

interface AiMatchAnalysis {
  aiMatchScore: number;
  verdict: 'strong_match' | 'good_match' | 'partial_match' | 'weak_match';
  summary: string;
  strengths: string[];
  improvements: { skill: string; tip: string }[];
  hrRecommendation: string;
  relatedSkills: string[];
}

interface AiMatchCardProps {
  aiAnalysis: AiMatchAnalysis;
  algorithmicScore: number;
}

const VERDICT_CONFIG = {
  strong_match: { label: 'Strong Match', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  good_match: { label: 'Good Match', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  partial_match: { label: 'Partial Match', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  weak_match: { label: 'Weak Match', dot: 'bg-red-500', bar: 'bg-red-500' },
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreStroke(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getScoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function AiMatchCard({ aiAnalysis, algorithmicScore }: AiMatchCardProps) {
  const [expandedTip, setExpandedTip] = useState<number | null>(0);
  const verdict = VERDICT_CONFIG[aiAnalysis.verdict];
  const delta = aiAnalysis.aiMatchScore - algorithmicScore;

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (aiAnalysis.aiMatchScore / 100) * circumference;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">AI Analysis</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`w-1.5 h-1.5 rounded-full ${verdict.dot}`} />
          {verdict.label}
        </span>
      </div>

      <div className="p-4 space-y-0">
        {/* Score + Summary */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-4">
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                className="text-border"
                strokeWidth="5"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={getScoreStroke(aiAnalysis.aiMatchScore)}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor(aiAnalysis.aiMatchScore)}`}>
                {aiAnalysis.aiMatchScore}%
              </span>
              <span className="text-[10px] text-muted-foreground">AI Score</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {/* Score comparison bars */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">Algorithm</span>
                <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreBg(algorithmicScore)} transition-all duration-700`}
                    style={{ width: `${algorithmicScore}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-9 text-right">
                  {algorithmicScore}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0">AI</span>
                <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getScoreBg(aiAnalysis.aiMatchScore)} transition-all duration-700`}
                    style={{ width: `${aiAnalysis.aiMatchScore}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-medium w-9 text-right ${getScoreColor(aiAnalysis.aiMatchScore)}`}
                >
                  {aiAnalysis.aiMatchScore}%
                </span>
              </div>
              {delta !== 0 && (
                <p className="text-[10px] text-muted-foreground">
                  AI adjusted the score by{' '}
                  <span className={delta > 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </span>{' '}
                  based on related skills and context
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.summary}</p>
          </div>
        </div>

        {/* HR Recommendation — key actionable insight, placed first */}
        <div className="border-t border-border pt-4 pb-4">
          <div className="flex items-start gap-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Recommendation</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {aiAnalysis.hrRecommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Strengths */}
        {aiAnalysis.strengths.length > 0 && (
          <div className="border-t border-border pt-4 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Strengths
            </p>
            <ul className="space-y-1.5">
              {aiAnalysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {aiAnalysis.improvements.length > 0 && (
          <div className="border-t border-border pt-4 pb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Areas to Improve
            </p>
            <div className="space-y-1.5">
              {aiAnalysis.improvements.map((imp, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-light transition-colors"
                  >
                    <span className="text-sm text-foreground">{imp.skill}</span>
                    {expandedTip === i ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {expandedTip === i && (
                    <div className="px-3 pb-2.5 border-t border-border">
                      <p className="text-sm text-muted-foreground pt-2 leading-relaxed">
                        {imp.tip}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Skills */}
        {aiAnalysis.relatedSkills.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Related Skills
            </p>
            <p className="text-[10px] text-muted-foreground/70 mb-2">
              Candidate skills that relate to requirements but were not matched directly
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aiAnalysis.relatedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-md text-xs text-muted-foreground bg-surface-light border border-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
