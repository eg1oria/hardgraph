'use client';

import { BarChart3 } from 'lucide-react';
import { SkillRadarChart } from '@/components/scan/SkillRadarChart';
import { CategoryBar } from '@/components/scan/CategoryBar';

interface SkillStat {
  name: string;
  color: string;
  score: number;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    weight: number;
  }>;
}

interface SkillStatsSectionProps {
  skillStats: SkillStat[];
}

const topSkillColors = ['#6366f1', '#22d3ee', '#a855f7', '#f97316', '#ec4899'];

export function SkillStatsSection({ skillStats }: SkillStatsSectionProps) {
  if (skillStats.length === 0) return null;

  // Top 5 skills across all categories
  const allSkills = skillStats.flatMap((cat) => cat.skills).sort((a, b) => b.weight - a.weight);
  const seen = new Set<string>();
  const topSkills: typeof allSkills = [];
  for (const s of allSkills) {
    if (!seen.has(s.name)) {
      seen.add(s.name);
      topSkills.push(s);
      if (topSkills.length >= 5) break;
    }
  }

  const totalSkills = new Set(skillStats.flatMap((c) => c.skills.map((s) => s.name))).size;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Skill Stats</h2>
        <span className="text-xs text-muted-foreground">
          ({totalSkills} skills · {skillStats.length} categories)
        </span>
      </div>

      <div className="space-y-6">
        {/* Top skills */}
        {topSkills.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {topSkills.map((skill, i) => (
              <div
                key={skill.name}
                className="rounded-xl border border-border bg-surface/80 backdrop-blur-xl p-3 text-center"
              >
                <div
                  className="text-lg font-extrabold mb-0.5"
                  style={{ color: topSkillColors[i % topSkillColors.length] }}
                >
                  #{i + 1}
                </div>
                <div className="text-xs font-semibold text-foreground truncate">{skill.name}</div>
              </div>
            ))}
          </div>
        )}

        {/* Radar chart */}
        {skillStats.length >= 3 && (
          <div className="rounded-xl border border-border bg-surface/80 backdrop-blur-xl p-6">
            <SkillRadarChart
              categories={skillStats.map((c) => ({
                name: c.name,
                score: c.score,
                color: c.color,
              }))}
            />
          </div>
        )}

        {/* Category bars */}
        {skillStats.map((category, i) => (
          <CategoryBar
            key={category.name}
            name={category.name}
            color={category.color}
            score={category.score}
            skills={category.skills}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
