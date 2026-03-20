'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  strong_match: {
    label: 'Strong Match',
    emoji: '✨',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
  },
  good_match: {
    label: 'Good Match',
    emoji: '👍',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15 border-blue-500/30',
  },
  partial_match: {
    label: 'Partial Match',
    emoji: '🤔',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
  },
  weak_match: {
    label: 'Weak Match',
    emoji: '⚠️',
    color: 'text-red-400',
    bg: 'bg-red-500/15 border-red-500/30',
  },
};

function getAiScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 35) return 'text-amber-400';
  return 'text-red-400';
}

function getAiScoreStroke(score: number) {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#60a5fa';
  if (score >= 35) return '#fbbf24';
  return '#f87171';
}

export function AiMatchCard({ aiAnalysis, algorithmicScore }: AiMatchCardProps) {
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const verdict = VERDICT_CONFIG[aiAnalysis.verdict];

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (aiAnalysis.aiMatchScore / 100) * circumference;

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-purple-500/20 flex items-center gap-2">
        <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          AI Analysis
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${verdict.bg}`}>
          {verdict.emoji} {verdict.label}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Score + Summary */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Circular score */}
          <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={getAiScoreStroke(aiAnalysis.aiMatchScore)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getAiScoreColor(aiAnalysis.aiMatchScore)}`}>
                {aiAnalysis.aiMatchScore}%
              </span>
              <span className="text-[10px] text-muted-foreground">AI Score</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {/* Score comparison */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Algorithm: <span className="font-medium text-foreground">{algorithmicScore}%</span>
              </span>
              <span className="text-muted">→</span>
              <span className="text-muted-foreground">
                AI:{' '}
                <span className={`font-medium ${getAiScoreColor(aiAnalysis.aiMatchScore)}`}>
                  {aiAnalysis.aiMatchScore}%
                </span>
              </span>
              {aiAnalysis.aiMatchScore > algorithmicScore && (
                <span className="text-[10px] text-emerald-400">
                  +{aiAnalysis.aiMatchScore - algorithmicScore}%
                </span>
              )}
            </div>
            {/* Summary */}
            <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.summary}</p>
          </div>
        </div>

        {/* Strengths */}
        {aiAnalysis.strengths.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Strengths
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aiAnalysis.strengths.map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                >
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Improvements */}
        {aiAnalysis.improvements.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Suggested Improvements
            </p>
            <div className="space-y-1.5">
              {aiAnalysis.improvements.map((imp, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-surface-light border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left"
                  >
                    <span className="text-xs font-medium">{imp.skill}</span>
                    {expandedTip === i ? (
                      <ChevronUp className="w-3 h-3 text-muted shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-muted shrink-0" />
                    )}
                  </button>
                  {expandedTip === i && (
                    <div className="px-3 pb-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground pt-2">{imp.tip}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Skills */}
        {aiAnalysis.relatedSkills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Related Skills Detected
            </p>
            <p className="text-[10px] text-muted-foreground mb-2">
              Skills the algorithm missed but AI considers relevant
            </p>
            <div className="flex flex-wrap gap-1.5">
              {aiAnalysis.relatedSkills.map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/20"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* HR Recommendation */}
        <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-3">
          <div className="flex items-start gap-2">
            <span className="text-sm shrink-0">💡</span>
            <div>
              <p className="text-xs font-medium text-cyan-400 mb-1">HR Recommendation</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {aiAnalysis.hrRecommendation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
