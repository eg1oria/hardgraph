'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, Code2, Copy, AlertTriangle } from 'lucide-react';
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
}

export function EmbedModal({
  open,
  onClose,
  username,
  slug,
  title,
  isPublic,
  nodeCount,
}: EmbedModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  const svgUrl = `${apiUrl}/embed/${encodeURIComponent(username)}/${encodeURIComponent(slug)}.svg`;
  const graphUrl = `${appUrl}/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`;

  // Escape characters that break markdown image/link syntax
  const safeTitle = title.replace(/[[\]()\\]/g, (ch) => '\\' + ch);

  const markdownCode = useMemo(
    () => `[![${safeTitle}](${svgUrl})](${graphUrl})`,
    [safeTitle, svgUrl, graphUrl],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdownCode);
      setCopied(true);
      toast('Embed code copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy', 'error');
    }
  }, [markdownCode, toast]);

  return (
    <Modal open={open} onClose={onClose} title="Embed your skill tree" className="max-w-lg">
      {!isPublic ? (
        <div className="flex flex-col items-center text-center py-6 gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="font-medium">Graph is private</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Make your graph public first to generate an embed code. Toggle visibility in the editor
            toolbar.
          </p>
        </div>
      ) : nodeCount === 0 ? (
        <div className="flex flex-col items-center text-center py-6 gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center">
            <Code2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium">No skills to embed</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Add some skill nodes to your graph first, then come back to generate an embed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Preview
            </label>
            <div className="rounded-lg border border-border bg-background p-3 flex justify-center overflow-x-auto">
              <img
                src={svgUrl}
                alt={`${title} skill embed`}
                className="max-w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* Format label */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Markdown
            </label>
            <div className="relative group">
              <pre className="rounded-lg border border-border bg-background p-3 pr-12 text-xs text-foreground/80 font-mono overflow-x-auto whitespace-pre-wrap break-all select-all">
                {markdownCode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 rounded-md bg-surface hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Copy embed code"
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

          {/* Usage hint */}
          <p className="text-xs text-muted-foreground">
            Paste this into your GitHub README, blog, or portfolio. The card updates automatically
            when you change your graph.
          </p>

          {/* Copy button (large, for mobile) */}
          <button onClick={handleCopy} className="btn-primary w-full justify-center">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Embed Code
              </>
            )}
          </button>
        </div>
      )}
    </Modal>
  );
}
