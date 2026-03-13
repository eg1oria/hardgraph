'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, Eye, GitFork, Search } from 'lucide-react';

import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';

interface ExploreGraph {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  viewCount: number;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  _count: { nodes: number; edges: number };
}

export default function ExplorePage() {
  const [graphs, setGraphs] = useState<ExploreGraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const loadGraphs = () => {
    setLoading(true);
    setError(false);
    api
      .get<ExploreGraph[]>('/graphs/explore')
      .then((data) => {
        setGraphs(data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadGraphs();
  }, []);

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

      {/* Search */}
      <div className="relative mb-6 sm:mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search skill trees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10 w-full"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-muted-foreground">
          <Compass className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="mb-3">Failed to load skill trees</p>
          <button onClick={loadGraphs} className="btn-secondary text-sm">
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
