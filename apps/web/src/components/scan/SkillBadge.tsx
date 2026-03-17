'use client';

import { cn } from '@/lib/utils';

interface SkillBadgeProps {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

const levelStyles: Record<string, string> = {
  beginner: 'border-zinc-500/40 text-zinc-400 bg-zinc-500/10',
  intermediate: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
  advanced: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
  expert: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
};

const levelLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function SkillBadge({ name, level }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
        'transition-colors',
        levelStyles[level],
      )}
      title={levelLabels[level]}
    >
      {name}
    </span>
  );
}
