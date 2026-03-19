'use client';

import { useCallback, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

// UX: Share modal with copy-link, Twitter, Telegram sharing

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function ShareModal({ open, onClose, title, url }: ShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy', 'error');
    }
  }, [url, toast]);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <Modal open={open} onClose={onClose} title="Share story">
      <div className="space-y-4">
        {/* Copy link */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="input-field flex-1 text-sm"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Social share */}
        <div className="flex items-center gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border-light transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Twitter
          </a>
          <a
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border-light transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Telegram
          </a>
        </div>
      </div>
    </Modal>
  );
}
