'use client';

import { useCallback, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode,
  FileJson,
  Image,
  Link2,
  Lock,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
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

type DownloadFormat = 'png' | 'svg' | 'json';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function ExportModal({
  open,
  onClose,
  graphId,
  username,
  slug,
  title,
  isPublic,
  userPlan,
}: ExportModalProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const isPro = userPlan === 'pro' || userPlan === 'enterprise';
  const graphUrl = `${APP_URL}/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;

  const handleDownload = useCallback(
    async (format: DownloadFormat) => {
      if (downloading) return;
      setDownloading(format);

      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/export/${graphId}/${format}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const safeName = title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'skill-tree';
        const ext = format === 'json' ? 'json' : format === 'svg' ? 'svg' : 'png';
        a.download = `${safeName}.${ext}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast(`${format.toUpperCase()} downloaded!`, 'success');
      } catch {
        toast(`Failed to export ${format.toUpperCase()}`, 'error');
      } finally {
        setDownloading(null);
      }
    },
    [downloading, graphId, title, toast],
  );

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
          <Download className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Export & Share</h2>
          <p className="text-xs text-muted-foreground">Download or share your skill tree</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Download section */}
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">
            Download
          </span>
          <div className="grid grid-cols-3 gap-2">
            {/* PNG */}
            <button
              onClick={() => handleDownload('png')}
              disabled={!!downloading}
              className="relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:bg-surface-light hover:border-primary/20 transition-all group min-h-[100px]"
            >
              {downloading === 'png' ? (
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                <Image className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              )}
              <span className="text-xs font-semibold text-foreground">PNG</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">
                Image file
              </span>
              {!isPro && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  WM
                </span>
              )}
            </button>

            {/* SVG */}
            <button
              onClick={() => handleDownload('svg')}
              disabled={!!downloading}
              className="relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:bg-surface-light hover:border-primary/20 transition-all group min-h-[100px]"
            >
              {downloading === 'svg' ? (
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                <FileCode className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
              )}
              <span className="text-xs font-semibold text-foreground">SVG</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">
                Vector file
              </span>
              {!isPro && (
                <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  WM
                </span>
              )}
            </button>

            {/* JSON */}
            <button
              onClick={() => handleDownload('json')}
              disabled={!!downloading}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:bg-surface-light hover:border-primary/20 transition-all group min-h-[100px]"
            >
              {downloading === 'json' ? (
                <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                <FileJson className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              )}
              <span className="text-xs font-semibold text-foreground">JSON</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">
                Raw data
              </span>
            </button>
          </div>

          {!isPro && (
            <p className="text-[10px] text-muted-foreground/60 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400/60" />
              <span className="text-amber-400/60 font-medium">WM</span> = watermark.{' '}
              <a
                href="/settings/billing"
                className="text-primary/70 hover:text-primary hover:underline"
              >
                Upgrade to Pro
              </a>{' '}
              to remove.
            </p>
          )}
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
