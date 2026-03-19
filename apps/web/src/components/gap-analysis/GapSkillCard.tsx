'use client';

import { ChevronRight } from 'lucide-react';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface GapSkillCardProps {
  name: string;
  icon?: string;
  category?: string;
  categoryColor?: string;
  userLevel: SkillLevel | null;
  targetLevel: SkillLevel;
  status: 'matched' | 'upgrade' | 'missing';
  recommendation?: string;
}

const LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

const STATUS_CONFIG = {
  matched: {
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-400',
    label: 'Matched',
    icon: '✅',
  },
  upgrade: {
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-400',
    label: 'Upgrade needed',
    icon: '⚠️',
  },
  missing: {
    border: 'border-red-500/30',
    badge: 'bg-red-500/15 text-red-400',
    label: 'Missing',
    icon: '❌',
  },
} as const;

function LevelDots({
  userLevel,
  targetLevel,
}: {
  userLevel: SkillLevel | null;
  targetLevel: SkillLevel;
}) {
  const userIdx = userLevel ? LEVELS.indexOf(userLevel) : -1;
  const targetIdx = LEVELS.indexOf(targetLevel);

  return (
    <div className="flex items-center gap-1">
      {LEVELS.map((level, i) => {
        const isUser = i <= userIdx;
        const isTarget = i <= targetIdx;
        let bg = 'bg-surface-light';
        if (isUser && isTarget) bg = 'bg-emerald-500';
        else if (isUser) bg = 'bg-cyan-500/50';
        else if (isTarget) bg = 'bg-red-500/40';

        return (
          <div
            key={level}
            className={`w-2.5 h-2.5 rounded-full ${bg} transition-colors`}
            title={level}
          />
        );
      })}
    </div>
  );
}

export function GapSkillCard({
  name,
  category,
  categoryColor,
  userLevel,
  targetLevel,
  status,
  recommendation,
}: GapSkillCardProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`card border ${config.border} transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{name}</h4>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${config.badge}`}>
              {config.icon} {config.label}
            </span>
          </div>
          {category && (
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: categoryColor ? `${categoryColor}20` : undefined,
                color: categoryColor ?? undefined,
              }}
            >
              {category}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="capitalize">{userLevel ?? 'none'}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="capitalize font-medium text-foreground">{targetLevel}</span>
        <div className="ml-auto">
          <LevelDots userLevel={userLevel} targetLevel={targetLevel} />
        </div>
      </div>

      {recommendation && (
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed border-t border-border pt-2">
          💡 {recommendation}
        </p>
      )}
    </div>
  );
}
