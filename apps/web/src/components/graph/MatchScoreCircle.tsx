'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface MatchScoreCircleProps {
  score: number;
  size?: number;
}

export function MatchScoreCircle({ score, size = 100 }: MatchScoreCircleProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80)
      return { stroke: '#10B981', text: 'text-emerald-400', glow: 'rgba(16,185,129,0.3)' };
    if (s >= 60) return { stroke: '#F59E0B', text: 'text-amber-400', glow: 'rgba(245,158,11,0.3)' };
    return { stroke: '#EF4444', text: 'text-red-400', glow: 'rgba(239,68,68,0.3)' };
  };

  const colors = getScoreColor(score);
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold tabular-nums ${colors.text}`}>{displayScore}%</span>
        <span className="text-[10px] text-muted-foreground">Match</span>
      </div>
    </div>
  );
}
