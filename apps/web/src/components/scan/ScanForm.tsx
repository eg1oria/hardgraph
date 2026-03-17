'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ScanForm() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    const valid = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(trimmed);
    if (!valid) {
      setError('Invalid GitHub username');
      return;
    }

    setError('');
    router.push(`/scan/${trimmed}`);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            placeholder="Enter GitHub username..."
            className={cn(
              'w-full rounded-xl border bg-surface/80 backdrop-blur-xl px-5 py-4 pr-12',
              'text-lg text-foreground placeholder:text-muted',
              'outline-none transition-all duration-200',
              'focus:border-primary focus:ring-2 focus:ring-primary/30',
              error ? 'border-red-500/50' : 'border-border',
            )}
            autoComplete="off"
            spellCheck={false}
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        </div>
        <button
          type="submit"
          className={cn(
            'rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white',
            'transition-all duration-200 hover:bg-primary/90',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'active:scale-[0.98] min-h-[56px]',
          )}
        >
          Scan
        </button>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </motion.form>
  );
}
