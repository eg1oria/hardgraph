'use client';

import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface EndorseButtonProps {
  nodeId: string;
  graphId: string;
  count: number;
  isOwner: boolean;
  isEndorsed: boolean;
  isLoggedIn: boolean;
  onEndorsed: (nodeId: string, newCount: number) => void;
  onUnendorsed: (nodeId: string, newCount: number) => void;
}

export function EndorseButton({
  nodeId,
  graphId,
  count,
  isOwner,
  isEndorsed: initialEndorsed,
  isLoggedIn,
  onEndorsed,
  onUnendorsed,
}: EndorseButtonProps) {
  const [endorsed, setEndorsed] = useState(initialEndorsed);
  const [displayCount, setDisplayCount] = useState(count);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);

  if (isOwner) return null;

  const handleEndorse = async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    setEndorsed(true);
    setDisplayCount((c) => c + 1);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);

    try {
      const res = await api.post<{ endorsementCount: number }>('/endorsements', {
        nodeId,
        graphId,
      });
      setDisplayCount(res.endorsementCount);
      onEndorsed(nodeId, res.endorsementCount);
    } catch {
      // Revert optimistic update
      setEndorsed(false);
      setDisplayCount((c) => Math.max(0, c - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleUnendorse = async () => {
    if (loading || !isLoggedIn) return;
    setLoading(true);

    // Optimistic update
    setEndorsed(false);
    setDisplayCount((c) => Math.max(0, c - 1));

    try {
      const res = await api.delete<{ endorsementCount: number }>(`/endorsements/${nodeId}`);
      setDisplayCount(res.endorsementCount);
      onUnendorsed(nodeId, res.endorsementCount);
    } catch {
      // Revert
      setEndorsed(true);
      setDisplayCount((c) => c + 1);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn && !endorsed) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleEndorse}
          disabled={loading}
          className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all min-h-[44px] border ${
            pulse
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 scale-[1.02]'
              : 'bg-emerald-500/[0.06] border-emerald-500/10 text-emerald-400/90 hover:bg-emerald-500/[0.12] hover:border-emerald-500/20'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Endorse {displayCount > 0 && <span className="tabular-nums">({displayCount})</span>}
        </button>
        <p className="text-[11px] text-muted-foreground/50 text-center">
          <Link href="/login" className="text-primary/70 hover:text-primary hover:underline">
            Sign in
          </Link>{' '}
          for unlimited endorsements
        </p>
      </div>
    );
  }

  if (endorsed) {
    return (
      <button
        onClick={handleUnendorse}
        disabled={loading || !isLoggedIn}
        className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all min-h-[44px] border bg-emerald-500/15 border-emerald-500/30 text-emerald-300 ${
          isLoggedIn ? 'hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-300' : ''
        } ${pulse ? 'scale-[1.02]' : ''}`}
        title={isLoggedIn ? 'Remove endorsement' : 'Endorsed'}
      >
        <ThumbsUp className="w-3.5 h-3.5 fill-current" />
        Endorsed ✓ {displayCount > 0 && <span className="tabular-nums">({displayCount})</span>}
      </button>
    );
  }

  return (
    <button
      onClick={handleEndorse}
      disabled={loading}
      className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all min-h-[44px] border ${
        pulse
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 scale-[1.02]'
          : 'bg-emerald-500/[0.06] border-emerald-500/10 text-emerald-400/90 hover:bg-emerald-500/[0.12] hover:border-emerald-500/20'
      }`}
    >
      <ThumbsUp className="w-3.5 h-3.5" />
      Endorse {displayCount > 0 && <span className="tabular-nums">({displayCount})</span>}
    </button>
  );
}
