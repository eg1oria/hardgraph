'use client';

import { useState, useEffect } from 'react';
import { Github, Star, GitFork, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Modal } from '@/components/ui/Modal';

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

interface ImportGithubModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (
    repos: Array<{
      name: string;
      description?: string;
      nodeType: string;
      level: string;
      customData: Record<string, unknown>;
    }>,
  ) => void;
}

export function ImportGithubModal({ open, onClose, onImport }: ImportGithubModalProps) {
  const user = useAuthStore((s) => s.user);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open && user?.githubUsername) {
      setLoading(true);
      setSelected(new Set());
      setSearch('');
      let cancelled = false;
      api
        .get<GithubRepo[]>('/github/repos')
        .then((data) => {
          if (!cancelled) setRepos(data);
        })
        .catch(() => {
          if (!cancelled) setRepos([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [open, user?.githubUsername]);

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const selectedRepos = repos
        .filter((r) => selected.has(r.id))
        .map((r) => ({
          name: r.name,
          description: r.description ?? undefined,
          nodeType: 'repository',
          level: 'beginner',
          customData: {
            repoUrl: r.html_url,
            language: r.language,
            stars: r.stargazers_count,
            forks: r.forks_count,
            fullName: r.full_name,
          },
        }));
      await onImport(selectedRepos);
    } finally {
      setImporting(false);
      onClose();
    }
  };

  if (!user?.githubUsername) {
    return (
      <Modal open={open} onClose={onClose} title="Import from GitHub">
        <div className="text-center py-6">
          <Github className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Connect your GitHub account to import repositories as nodes.
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/github`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#24292f] hover:bg-[#32383f] text-white text-sm font-medium transition-colors"
          >
            <Github className="w-4 h-4" />
            Connect GitHub
          </a>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Import from GitHub">
      <div className="space-y-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search repositories..."
          className="input-field"
        />

        <div className="max-h-80 overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No repositories found</p>
          ) : (
            filtered.map((repo) => (
              <button
                key={repo.id}
                onClick={() => toggle(repo.id)}
                role="checkbox"
                aria-checked={selected.has(repo.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                  selected.has(repo.id)
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-surface-light/50 border border-transparent hover:bg-surface-light'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    selected.has(repo.id) ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {selected.has(repo.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{repo.name}</p>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
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
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="btn-primary"
            >
              {importing ? 'Importing...' : `Import ${selected.size} repos`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
