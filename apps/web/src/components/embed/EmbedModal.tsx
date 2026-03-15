'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Code2, Copy, ExternalLink, Lock, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface EmbedModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
  slug: string;
  title: string;
  isPublic: boolean;
  nodeCount: number;
  updatedAt?: string;
}

type EmbedFormat = 'markdown' | 'html' | 'iframe';

const FORMAT_LABELS: Record<EmbedFormat, string> = {
  markdown: 'Markdown',
  html: 'HTML',
  iframe: 'iFrame',
};

export function EmbedModal({
  open,
  onClose,
  username,
  slug,
  title,
  isPublic,
  nodeCount,
  updatedAt,
}: EmbedModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<EmbedFormat>('markdown');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Stable version key derived from updatedAt
  const embedVersion = updatedAt ? String(new Date(updatedAt).getTime()) : '0';

  // Reset image state when version changes so preview refreshes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [embedVersion]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const baseSvgUrl = `${apiUrl}/embed/${encodeURIComponent(username)}/${encodeURIComponent(slug)}.svg`;
  const svgUrl = `${baseSvgUrl}?v=${embedVersion}`;
  const graphUrl = `${appUrl}/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;
  const embedUrl = `${appUrl}/embed/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;

  // Escape characters that break markdown image/link syntax
  const safeTitle = title.replace(/[[\]()\\]/g, (ch) => '\\' + ch);

  const codeSnippets = useMemo<Record<EmbedFormat, string>>(
    () => ({
      markdown: `[![${safeTitle}](${svgUrl})](${graphUrl})`,
      html: `<a href="${graphUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${svgUrl}" alt="${safeTitle}" width="495" />\n</a>`,
      iframe: `<iframe src="${embedUrl}?v=${embedVersion}" width="800" height="500" style="border:none;border-radius:12px;" loading="lazy"></iframe>`,
    }),
    [safeTitle, svgUrl, graphUrl, embedUrl, embedVersion],
  );

  const currentCode = codeSnippets[format];

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast('Copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy', 'error');
    }
  }, [currentCode, toast]);

  return (
    <Modal open={open} onClose={onClose} title="" className="max-w-lg">
      {/* Custom header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center ring-1 ring-indigo-500/20">
          <Code2 className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Embed Skill Card</h2>
          <p className="text-xs text-muted-foreground">Share your skills anywhere</p>
        </div>
      </div>

      {!isPublic ? (
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-foreground">Graph is private</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Make your graph public to generate embed code. You can toggle visibility in the editor
              toolbar.
            </p>
          </div>
        </div>
      ) : nodeCount === 0 ? (
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center ring-1 ring-border">
            <Sparkles className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-foreground">No skills to show</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Add skill nodes to your graph first, then come back to generate an embed card.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Preview
              </span>
              <a
                href={svgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Open SVG
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="rounded-xl border border-border bg-[#0B1120] p-4 flex justify-center overflow-x-auto">
              {!imgLoaded && !imgError && (
                <div className="w-full h-[200px] flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                </div>
              )}
              {imgError && (
                <div className="w-full h-[120px] flex items-center justify-center text-sm text-muted-foreground">
                  Failed to load preview
                </div>
              )}
              <img
                key={embedVersion}
                src={svgUrl}
                alt={`${title} skill embed`}
                className={`max-w-full h-auto transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </div>
          </div>

          {/* Format tabs */}
          <div>
            <div className="flex items-center gap-1 mb-2.5 p-0.5 rounded-lg bg-surface-light/50 w-fit">
              {(Object.keys(FORMAT_LABELS) as EmbedFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider transition-all min-h-[32px] ${
                    format === f
                      ? 'bg-surface text-foreground shadow-sm ring-1 ring-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>
            <div className="relative group">
              <pre className="rounded-xl border border-border bg-surface p-3.5 pr-12 text-xs text-foreground/80 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed select-all">
                {currentCode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-surface-light hover:bg-border text-muted-foreground hover:text-foreground transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Copy code"
                aria-label="Copy embed code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Hint */}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {format === 'markdown'
              ? 'Paste into your GitHub README, docs, or any markdown file.'
              : format === 'html'
                ? 'Add to any website, blog post, or portfolio page.'
                : 'Embed an interactive skill tree viewer. Supports pan & zoom.'}{' '}
            Updates automatically when you edit your graph.
          </p>

          {/* Primary CTA */}
          <button onClick={handleCopy} className="btn-primary w-full justify-center gap-2 h-11">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy {FORMAT_LABELS[format]} Code
              </>
            )}
          </button>
        </div>
      )}
    </Modal>
  );
}
