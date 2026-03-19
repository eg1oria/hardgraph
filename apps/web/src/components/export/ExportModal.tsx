'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, FileText, Link2, Lock, Share2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  graphId: string;
  username: string;
  slug: string;
  title: string;
  isPublic: boolean;
  userPlan: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function ExportModal({ open, onClose, username, slug, title, isPublic }: ExportModalProps) {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);

  const graphUrl = `${APP_URL}/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;
  const resumeUrl = `/${encodeURIComponent(username)}/resume/${encodeURIComponent(slug)}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(graphUrl);
      setCopiedLink(true);
      toast('Link copied!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast('Failed to copy', 'error');
    }
  }, [graphUrl, toast]);

  const handleShareTwitter = useCallback(() => {
    const text = `Check out my skill tree "${title}" on HardGraph!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(graphUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  }, [title, graphUrl]);

  const handleShareLinkedIn = useCallback(() => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(graphUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  }, [graphUrl]);

  return (
    <Modal open={open} onClose={onClose} title="" className="max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center ring-1 ring-indigo-500/20">
          <FileText className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Resume & Share</h2>
          <p className="text-xs text-muted-foreground">Create a resume or share your skill tree</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Resume section */}
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">
            Resume
          </span>
          <Link
            href={resumeUrl}
            onClick={onClose}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-surface-light hover:border-primary/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center ring-1 ring-emerald-500/20 shrink-0">
              <FileText className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-foreground block">Create Resume</span>
              <span className="text-xs text-muted-foreground">
                Generate a professional resume from your skill tree
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Share section */}
        {isPublic && (
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">
              Quick Share
            </span>
            <div className="space-y-2">
              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-light transition-all text-left min-h-[44px]"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs text-foreground font-medium truncate flex-1">
                  {copiedLink ? 'Copied!' : graphUrl.replace(/^https?:\/\//, '')}
                </span>
                <Copy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>

              {/* Social buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleShareTwitter}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-light transition-all text-xs font-medium text-muted-foreground hover:text-foreground min-h-[44px]"
                >
                  <X className="w-3.5 h-3.5" />
                  Twitter / X
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-light transition-all text-xs font-medium text-muted-foreground hover:text-foreground min-h-[44px]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  LinkedIn
                </button>
              </div>
            </div>
          </div>
        )}

        {!isPublic && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Make your graph <span className="text-amber-400 font-medium">public</span> to enable
              sharing links and social sharing.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
