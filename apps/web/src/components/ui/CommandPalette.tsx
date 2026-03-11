'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, Compass, BookTemplate, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  icon: typeof Search;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands: Command[] = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: LayoutDashboard,
      action: () => router.push('/dashboard'),
    },
    {
      id: 'new-graph',
      label: 'Create New Graph',
      icon: Plus,
      action: () => router.push('/editor/new'),
    },
    {
      id: 'explore',
      label: 'Explore Community',
      icon: Compass,
      action: () => router.push('/explore'),
    },
    {
      id: 'templates',
      label: 'Browse Templates',
      icon: BookTemplate,
      action: () => router.push('/templates'),
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: Settings,
      action: () => router.push('/settings'),
    },
  ];

  const filtered = useMemo(
    () =>
      query
        ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
        : commands,
    [query, commands],
  );

  // Reset index when filter changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const runCommand = useCallback((cmd: Command) => {
    setOpen(false);
    cmd.action();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightedIndex]) {
        runCommand(filtered[highlightedIndex]);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl bg-surface border border-border shadow-2xl overflow-hidden animate-in"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent py-3.5 text-base sm:text-sm outline-none placeholder:text-muted"
          />
          <kbd className="text-[10px] text-muted bg-surface-light px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>
        <div className="max-h-64 overflow-y-auto p-2" role="listbox" aria-label="Commands">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">No commands found</div>
          ) : (
            filtered.map((cmd, index) => (
              <button
                key={cmd.id}
                role="option"
                aria-selected={index === highlightedIndex}
                onClick={() => runCommand(cmd)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  index === highlightedIndex
                    ? 'bg-surface-light text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-light',
                )}
              >
                <cmd.icon className="w-4 h-4" />
                {cmd.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
