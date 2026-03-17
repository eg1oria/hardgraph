'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillRadarChart } from './SkillRadarChart';
import { CategoryBar } from './CategoryBar';
import { ShareButtons } from './ShareButtons';
import type { ScanResult } from '@/types/scan';

interface ScanResultViewProps {
  result: ScanResult;
}

const topSkillColors = ['#6366f1', '#22d3ee', '#a855f7', '#f97316', '#ec4899'];

export function ScanResultView({ result }: ScanResultViewProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-16">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Profile header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left"
        >
          <Image
            src={result.avatarUrl}
            alt={result.username}
            width={96}
            height={96}
            className="rounded-full border-2 border-border"
          />
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {result.username}
            </h1>
            <p className="text-muted-foreground mt-1">
              {result.totalRepos} repos · {result.totalLanguages} languages · {result.totalSkills}{' '}
              skills
            </p>
          </div>
        </motion.div>

        {/* Radar chart */}
        {result.categories.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-xl border border-border bg-surface/80 backdrop-blur-xl p-6"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
              Skill Radar
            </h2>
            <SkillRadarChart
              categories={result.categories.map((c) => ({
                name: c.name,
                score: c.score,
                color: c.color,
              }))}
            />
          </motion.div>
        )}

        {/* Top skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Top Skills
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {result.topSkills.map((skill, i) => (
              <div
                key={skill}
                className={cn(
                  'rounded-xl border border-border bg-surface/80 backdrop-blur-xl p-4',
                  'text-center transition-all hover:border-border-light',
                )}
              >
                <div
                  className="text-2xl font-extrabold mb-1"
                  style={{ color: topSkillColors[i % topSkillColors.length] }}
                >
                  #{i + 1}
                </div>
                <div className="text-sm font-semibold text-foreground truncate">{skill}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Categories with progress bars */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Categories</h2>
          {result.categories.map((category, i) => (
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

        {/* Share buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-3"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Share</h2>
          <ShareButtons username={result.username} />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center"
        >
          <p className="text-foreground font-semibold mb-3">
            Want more detail? Create your HardGraph account
          </p>
          <Link
            href="/signup"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3',
              'text-sm font-semibold text-white transition-all hover:bg-primary/90',
              'active:scale-[0.98]',
            )}
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Watermark */}
        <div className="text-center text-sm text-muted">
          Made with HardGraph <Zap className="inline w-3.5 h-3.5" />
        </div>
      </div>
    </main>
  );
}
