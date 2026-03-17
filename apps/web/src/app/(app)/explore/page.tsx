'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Eye, GitFork, Search, ThumbsUp } from 'lucide-react';

import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';

interface ExploreGraph {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  viewCount: number;
  endorsementCount: number;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count: { nodes: number; edges: number };
  forkCount: number;
}

export default function ExplorePage() {
  const [graphs, setGraphs] = useState<ExploreGraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'endorsed'>('recent');

  const loadGraphs = useCallback(() => {
    setLoading(true);
    setError(false);
    api
      .get<ExploreGraph[]>(`/graphs/explore?sort=${sort}`)
      .then((data) => {
        setGraphs(data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sort]);

  useEffect(() => {
    loadGraphs();
  }, [loadGraphs]);

  const filtered = graphs.filter(
    (g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.user.username.toLowerCase().includes(search.toLowerCase()) ||
      (g.user.displayName?.toLowerCase().includes(search.toLowerCase()) ?? false),
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Explore
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discover skill trees created by the community
          </p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skill trees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSort('recent')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sort === 'recent'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSort('endorsed')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              sort === 'endorsed'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Most endorsed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-muted-foreground">
          <Compass className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="mb-3">Failed to load skill trees</p>
          <button onClick={() => loadGraphs()} className="btn-secondary text-sm">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Compass className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{search ? 'No matching skill trees found' : 'No public skill trees yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((graph) => (
            <Link
              key={graph.id}
              href={`/${graph.user.username}/${graph.slug}`}
              className="card card-hover group"
            >
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {graph.title}
                </h3>
                {graph.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {graph.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <Avatar
                    src={graph.user.avatarUrl ?? undefined}
                    fallback={graph.user.displayName || graph.user.username}
                    size="sm"
                  />
                  <span className="text-sm text-muted-foreground">
                    {graph.user.displayName || graph.user.username}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {graph._count.nodes} nodes
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {graph.viewCount}
                  </span>
                  {graph.endorsementCount > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400/70">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {graph.endorsementCount}
                    </span>
                  )}
                  {graph.forkCount > 0 && (
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5" />
                      {graph.forkCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
