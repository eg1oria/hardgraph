'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { SkillBadge } from './SkillBadge';

interface CategoryBarProps {
  name: string;
  color: string;
  score: number;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    weight: number;
  }>;
  index: number;
}

export function CategoryBar({ name, color, score, skills, index }: CategoryBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold text-foreground">{name}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {score}%
        </span>
      </div>

      <div className="h-2.5 rounded-full bg-surface-light overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${score}%` } : { width: 0 }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <SkillBadge key={skill.name} name={skill.name} level={skill.level} />
        ))}
      </div>
    </motion.div>
  );
}
