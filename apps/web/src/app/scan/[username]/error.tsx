'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ScanError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Scan error:', error);
  }, [error]);

  const isNotFound = error.message?.includes('not found') || error.message?.includes('Not found');
  const isRateLimit = error.message?.includes('rate limit');

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isNotFound
              ? 'User Not Found'
              : isRateLimit
                ? 'Rate Limit Reached'
                : 'Something Went Wrong'}
          </h1>
          <p className="text-muted-foreground">
            {isNotFound
              ? "We couldn't find that GitHub user. Please check the username and try again."
              : isRateLimit
                ? 'GitHub API limit reached. Try again in a few minutes.'
                : 'An error occurred while scanning. Please try again.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3',
              'text-sm font-semibold text-white transition-all hover:bg-primary/90',
              'active:scale-[0.98]',
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/scan"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3',
              'text-sm font-medium text-foreground bg-surface/80',
              'transition-all hover:border-border-light hover:bg-surface-light',
            )}
          >
            Back to Scan
          </Link>
        </div>
      </div>
    </main>
  );
}
