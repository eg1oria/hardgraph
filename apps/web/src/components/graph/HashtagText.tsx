'use client';

import { memo, useMemo } from 'react';
import { parseHashtags, type Segment } from '@/lib/hashtag-parser';

interface HashtagTextProps {
  /** The raw text that may contain #hashtags */
  text: string;
  /** Called when a hashtag is clicked. If omitted, tags render as styled spans (no interaction). */
  onTagClick?: (tag: string, slug: string) => void;
  /** Extra class for the wrapper */
  className?: string;
}

/**
 * Renders text with inline hashtags highlighted.
 * Hashtags become clickable buttons when `onTagClick` is provided.
 */
export const HashtagText = memo(function HashtagText({ text, onTagClick, className }: HashtagTextProps) {
  const segments: Segment[] = useMemo(() => parseHashtags(text), [text]);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return <span key={i}>{seg.value}</span>;
        }

        if (onTagClick) {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onTagClick(seg.tag, seg.slug);
              }}
              className="inline text-primary-400 hover:text-primary hover:underline cursor-pointer font-medium transition-colors"
              title={`Go to #${seg.tag}`}
            >
              #{seg.tag}
            </button>
          );
        }

        return (
          <span key={i} className="text-primary-400 font-medium">
            #{seg.tag}
          </span>
        );
      })}
    </span>
  );
});
