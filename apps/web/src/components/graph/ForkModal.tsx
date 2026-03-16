'use client';

import { useState } from 'react';
import { GitFork, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface ForkModalProps {
  open: boolean;
  onClose: () => void;
  graphTitle: string;
  authorUsername: string;
  onFork: (title: string) => Promise<void>;
}

export function ForkModal({ open, onClose, graphTitle, authorUsername, onFork }: ForkModalProps) {
  const [title, setTitle] = useState(`${graphTitle} (fork)`);
  const [forking, setForking] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setForking(true);
    setError('');
    try {
      await onFork(title.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fork graph');
      setForking(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Fork Skill Tree">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-light/50 border border-border/50">
          <GitFork className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="text-sm">
            <span className="text-muted-foreground">Fork </span>
            <span className="font-medium text-foreground">&quot;{graphTitle}&quot;</span>
            <span className="text-muted-foreground"> by </span>
            <span className="font-medium text-primary">@{authorUsername}</span>
          </div>
        </div>

        <div>
          <label htmlFor="fork-title" className="block text-sm font-medium mb-1.5">
            Your graph title
          </label>
          <input
            id="fork-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="input-field w-full"
            placeholder="Enter a title for your fork"
            disabled={forking}
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost px-4 py-2 text-sm"
            disabled={forking}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={forking || !title.trim()}
            className="btn-primary !text-sm"
          >
            {forking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Forking...
              </>
            ) : (
              <>
                <GitFork className="w-4 h-4" />
                Fork to my account
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
