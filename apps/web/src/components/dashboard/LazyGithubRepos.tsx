'use client';

import { useEffect, useRef, useState } from 'react';
import { Github, Star, GitFork } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

export function LazyGithubRepos({ githubUsername }: { githubUsername: string | null | undefined }) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const fetched = useRef(false);

  // IntersectionObserver — trigger load when section scrolls into view
  useEffect(() => {
    if (!githubUsername) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [githubUsername]);

  useEffect(() => {
    if (!visible || fetched.current) return;
    fetched.current = true;
    setLoading(true);
    api
      .get<GithubRepo[]>('/github/repos')
      .then(setRepos)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [visible]);

  if (!githubUsername) return null;

  return (
    <div ref={sentinelRef} className="mt-10">
      {!visible ? (
        // Placeholder — same height as loaded section to avoid CLS
        <div className="h-48" />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">GitHub Repositories</h2>
            <span className="text-xs text-muted-foreground">({repos.length})</span>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">Failed to load repositories.</p>
          ) : repos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public repositories found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {repos.slice(0, 9).map((repo) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-hover group"
                >
                  <h3 className="font-semibold text-sm group-hover:text-primary-400 transition-colors truncate">
                    {repo.name}
                  </h3>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {repo.stargazers_count}
                      </span>
                    )}
                    {repo.forks_count > 0 && (
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" />
                        {repo.forks_count}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
