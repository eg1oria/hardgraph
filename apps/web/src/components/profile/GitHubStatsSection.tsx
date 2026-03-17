'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { SkillRadarChart } from '@/components/scan/SkillRadarChart';
import { CategoryBar } from '@/components/scan/CategoryBar';
import type { ScanResult } from '@/types/scan';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const topSkillColors = ['#6366f1', '#22d3ee', '#a855f7', '#f97316', '#ec4899'];

export function GitHubStatsSection({ githubUsername }: { githubUsername: string }) {
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(`${API_URL}/scan/${encodeURIComponent(githubUsername)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        // Handle API envelope
        const result: ScanResult = json?.data ?? json;
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled && err?.name !== 'AbortError') setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [githubUsername]);

  if (error || (!loading && !data)) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">GitHub Skill Stats</h2>
        {data && (
          <span className="text-xs text-muted-foreground">
            ({data.totalSkills} skills · {data.totalRepos} repos)
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top skills */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {data.topSkills.map((skill, i) => (
              <div
                key={skill}
                className="rounded-xl border border-border bg-surface/80 backdrop-blur-xl p-3 text-center"
              >
                <div
                  className="text-lg font-extrabold mb-0.5"
                  style={{ color: topSkillColors[i % topSkillColors.length] }}
                >
                  #{i + 1}
                </div>
                <div className="text-xs font-semibold text-foreground truncate">{skill}</div>
              </div>
            ))}
          </div>

          {/* Radar chart */}
          {data.categories.length >= 3 && (
            <div className="rounded-xl border border-border bg-surface/80 backdrop-blur-xl p-6">
              <SkillRadarChart
                categories={data.categories.map((c) => ({
                  name: c.name,
                  score: c.score,
                  color: c.color,
                }))}
              />
            </div>
          )}

          {/* Category bars */}
          {data.categories.map((category, i) => (
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
      ) : null}
    </div>
  );
}
