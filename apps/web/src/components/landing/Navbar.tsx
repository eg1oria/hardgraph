'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-gradient">
          HardGraph
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-xs px-4 py-2 rounded-lg bg-primary hover:bg-primary-600 text-white transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-light active:bg-surface-light transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-in">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-3 px-3 rounded-lg active:bg-surface-light min-h-[44px] flex items-center"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="block text-center text-sm px-4 py-3 rounded-lg bg-primary hover:bg-primary-600 text-white transition-colors min-h-[44px]"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
