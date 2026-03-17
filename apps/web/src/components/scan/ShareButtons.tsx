'use client';

import { useState } from 'react';
import { Link2, Twitter, Linkedin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  username: string;
}

export function ShareButtons({ username }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/scan/${username}`
      : `/scan/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out my GitHub Skill Tree! ${url} via @hardgraph`,
  )}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const btnClass = cn(
    'inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5',
    'text-sm font-medium text-foreground bg-surface/80 backdrop-blur-xl',
    'transition-all duration-200 hover:border-border-light hover:bg-surface-light',
    'active:scale-[0.98]',
  );

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={handleCopy} className={btnClass}>
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Link2 className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <Twitter className="w-4 h-4" />
        Share on Twitter
      </a>
      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
        <Linkedin className="w-4 h-4" />
        Share on LinkedIn
      </a>
    </div>
  );
}
