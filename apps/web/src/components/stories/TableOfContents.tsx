'use client';

import { useState } from 'react';
import type { TocHeading } from '@/lib/renderMarkdown';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

// UX: Auto-generated Table of Contents from markdown headings.
// Desktop: inline in sidebar. Mobile: collapsible drawer.

interface TableOfContentsProps {
  headings: TocHeading[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [open, setOpen] = useState(false);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setOpen(false);
    }
  };

  const tocList = (
    <nav aria-label="Table of contents">
      <ul className="space-y-1">
        {headings.map((h, i) => (
          <li key={i}>
            <button
              onClick={() => handleClick(h.id)}
              className={`w-full text-left text-sm transition-colors hover:text-foreground truncate ${
                h.level === 1
                  ? 'text-muted-foreground font-medium'
                  : h.level === 2
                    ? 'text-muted-foreground pl-3'
                    : 'text-muted pl-6 text-xs'
              }`}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <div className={`hidden lg:block ${className || ''}`}>
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Contents</h3>
        {tocList}
      </div>

      {/* Mobile: collapsible */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg border border-border"
          aria-expanded={open}
        >
          <List className="w-4 h-4" />
          Table of Contents
          {open ? (
            <ChevronUp className="w-3.5 h-3.5 ml-auto" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-auto" />
          )}
        </button>
        {open && (
          <div className="mt-2 p-3 rounded-lg border border-border bg-surface animate-fade-in">
            {tocList}
          </div>
        )}
      </div>
    </>
  );
}
