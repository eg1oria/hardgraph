'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Filter } from 'lucide-react';
import { ScoreCircle } from './ScoreCircle';
import { GapSkillCard } from './GapSkillCard';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface SkillGapItem {
  name: string;
  icon?: string;
  category?: string;
  categoryColor?: string;
  userLevel: SkillLevel | null;
  targetLevel: SkillLevel;
  status: 'matched' | 'upgrade' | 'missing';
  recommendation?: string;
}

interface BonusSkill {
  name: string;
  level: string;
  category?: string;
}

interface CategoryBreakdown {
  name: string;
  color: string;
  matchScore: number;
  matched: number;
  total: number;
}

export interface GapAnalysisData {
  graphId: string;
  templateId: string;
  templateName: string;
  matchScore: number;
  totalSkills: number;
  matchedCount: number;
  upgradeCount: number;
  missingCount: number;
  bonusCount: number;
  skills: SkillGapItem[];
  bonusSkills: BonusSkill[];
  categoryBreakdown: CategoryBreakdown[];
}

type StatusFilter = 'all' | 'matched' | 'upgrade' | 'missing';

const SUMMARY_CARDS = [
  { key: 'matched', label: 'Matched', icon: CheckCircle2, color: 'emerald' },
  { key: 'upgrade', label: 'Upgrade', icon: AlertTriangle, color: 'amber' },
  { key: 'missing', label: 'Missing', icon: XCircle, color: 'red' },
  { key: 'bonus', label: 'Bonus', icon: Sparkles, color: 'cyan' },
] as const;

export function GapAnalysisResult({ data }: { data: GapAnalysisData }) {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const counts: Record<string, number> = {
    matched: data.matchedCount,
    upgrade: data.upgradeCount,
    missing: data.missingCount,
    bonus: data.bonusCount,
  };

  const filteredSkills =
    filter === 'all' ? data.skills : data.skills.filter((s) => s.status === filter);

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <motion.div
        className="card flex flex-col sm:flex-row items-center gap-6 sm:gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ScoreCircle score={data.matchScore} />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold mb-1">Gap Analysis Result</h2>
          <p className="text-muted-foreground text-sm mb-3">
            Compared against{' '}
            <span className="text-foreground font-medium">{data.templateName}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {data.totalSkills} skills analyzed &middot; {data.matchedCount} matched &middot;{' '}
            {data.upgradeCount} to upgrade &middot; {data.missingCount} missing
          </p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUMMARY_CARDS.map((card, i) => (
          <motion.div
            key={card.key}
            className={`card border-${card.color}-500/20 text-center`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * i }}
          >
            <card.icon className={`w-5 h-5 mx-auto mb-2 text-${card.color}-500`} />
            <p className={`text-2xl font-bold text-${card.color}-500`}>{counts[card.key]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Category Breakdown */}
      {data.categoryBreakdown.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {data.categoryBreakdown.map((cat) => (
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
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.matchScore}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Skills List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" /> Skills Detail
          </h3>
          <div className="flex gap-1.5">
            {(['all', 'matched', 'upgrade', 'missing'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary/15 text-primary-400'
                    : 'bg-surface-light text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {filteredSkills.map((skill) => (
            <GapSkillCard key={skill.name} {...skill} />
          ))}
        </div>

        {filteredSkills.length === 0 && (
          <div className="card text-center py-6">
            <p className="text-sm text-muted-foreground">No skills match this filter.</p>
          </div>
        )}
      </div>

      {/* Bonus Skills */}
      {data.bonusSkills.length > 0 && (
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" /> Bonus Skills
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Skills in your graph that aren&apos;t required by the target template — these are your
            unique strengths!
          </p>
          <div className="flex flex-wrap gap-2">
            {data.bonusSkills.map((skill) => (
              <span
                key={skill.name}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
              >
                {skill.name}
                <span className="ml-1 opacity-60">({skill.level})</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
