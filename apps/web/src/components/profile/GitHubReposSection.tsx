'use client';

import { useEffect, useState } from 'react';
import { Github, Star, GitFork, Loader2, ExternalLink } from 'lucide-react';

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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function GitHubReposSection({ username }: { username: string }) {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/github/repos/public/${encodeURIComponent(username)}`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setRepos(json.data ?? json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (error || (!loading && repos.length === 0)) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Github className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">GitHub Repositories</h2>
        {!loading && <span className="text-xs text-muted-foreground">({repos.length})</span>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {repos.slice(0, 12).map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-sm group-hover:text-purple-400 transition-colors truncate pr-2">
                  {repo.name}
                </h3>
                <ExternalLink
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-muted-foreground shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                />
              </div>
              {repo.description && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                  {repo.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
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
    </div>
  );
}
