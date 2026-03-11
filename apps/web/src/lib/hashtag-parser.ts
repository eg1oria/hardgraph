/**
 * Hashtag parser for node descriptions.
 * Splits text into segments: plain text and hashtag tokens.
 * Supports Latin, Cyrillic, digits, and underscores.
 */

export interface TextSegment {
  type: 'text';
  value: string;
}

export interface HashtagSegment {
  type: 'hashtag';
  /** Raw tag without # (preserves original casing) */
  tag: string;
  /** Normalized slug: lowercase, trimmed */
  slug: string;
}

export type Segment = TextSegment | HashtagSegment;

// Matches # followed by letters (any script), digits, or underscores.
// Requires at least 1 character after #.
// Uses Unicode property escapes for broad language support.
const HASHTAG_RE = /#([\p{L}\p{N}_]+)/gu;

/**
 * Normalize a tag string to a slug for comparison/search.
 * Lowercases and trims.
 */
export function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim();
}

/**
 * Parse text into an array of text and hashtag segments.
 */
export function parseHashtags(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  // Reset regex state
  HASHTAG_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = HASHTAG_RE.exec(text)) !== null) {
    const matchStart = match.index;
    const tag = match[1]!;

    // Push preceding plain text if any
    if (matchStart > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, matchStart) });
    }

    segments.push({
      type: 'hashtag',
      tag,
      slug: normalizeTag(tag),
    });

    lastIndex = matchStart + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

/**
 * Check if text contains any hashtags.
 */
export function hasHashtags(text: string): boolean {
  HASHTAG_RE.lastIndex = 0;
  return HASHTAG_RE.test(text);
}
