'use client';

import { Skeleton } from '@/components/ui/Skeleton';

// UX: Skeleton loading cards matching Grid/List layout for perceived performance

export function StoryCardSkeleton({ variant }: { variant: 'grid' | 'list' }) {
  if (variant === 'grid') {
    return (
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 sm:gap-6 py-5 px-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
      <Skeleton className="shrink-0 w-24 h-24 sm:w-32 sm:h-24 rounded-lg" />
    </div>
  );
}
