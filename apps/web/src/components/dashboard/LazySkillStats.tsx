'use client';

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

const SkillStatsSection = lazy(() =>
  import('@/components/profile/SkillStatsSection').then((m) => ({
    default: m.SkillStatsSection,
  })),
);

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

export function LazySkillStats({ skillStats }: { skillStats: SkillStat[] }) {
  if (skillStats.length === 0) return null;

  return (
    <Suspense
      fallback={
        <div className="mt-10 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      }
    >
      <SkillStatsSection skillStats={skillStats} />
    </Suspense>
  );
}
