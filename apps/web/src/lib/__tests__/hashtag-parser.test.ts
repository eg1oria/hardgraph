import { describe, it, expect } from 'vitest';
import { parseHashtags, normalizeTag, hasHashtags } from '@/lib/hashtag-parser';

describe('normalizeTag', () => {
  it('converts to lowercase', () => {
    expect(normalizeTag('React')).toBe('react');
    expect(normalizeTag('TypeScript')).toBe('typescript');
  });

  it('handles cyrillic', () => {
    expect(normalizeTag('Реакт')).toBe('реакт');
    expect(normalizeTag('База_Данных')).toBe('база_данных');
  });

  it('trims whitespace', () => {
    expect(normalizeTag('  react  ')).toBe('react');
  });
});

describe('hasHashtags', () => {
  it('returns true when text contains hashtags', () => {
    expect(hasHashtags('Learn #react today')).toBe(true);
  });

  it('returns false when no hashtags', () => {
    expect(hasHashtags('Just plain text')).toBe(false);
  });

  it('returns false for lone #', () => {
    expect(hasHashtags('Price is # unknown')).toBe(false);
  });
});

describe('parseHashtags', () => {
  it('returns single text segment for plain text', () => {
    const result = parseHashtags('Hello world');
    expect(result).toEqual([{ type: 'text', value: 'Hello world' }]);
  });

  it('parses a single hashtag', () => {
    const result = parseHashtags('#react');
    expect(result).toEqual([{ type: 'hashtag', tag: 'react', slug: 'react' }]);
  });

  it('parses hashtag in the middle of text', () => {
    const result = parseHashtags('Learn #react today');
    expect(result).toEqual([
      { type: 'text', value: 'Learn ' },
      { type: 'hashtag', tag: 'react', slug: 'react' },
      { type: 'text', value: ' today' },
    ]);
  });

  it('parses multiple hashtags', () => {
    const result = parseHashtags('Нужно изучить #react и #typescript');
    expect(result).toEqual([
      { type: 'text', value: 'Нужно изучить ' },
      { type: 'hashtag', tag: 'react', slug: 'react' },
      { type: 'text', value: ' и ' },
      { type: 'hashtag', tag: 'typescript', slug: 'typescript' },
    ]);
  });

  it('handles cyrillic hashtags', () => {
    const result = parseHashtags('Учим #реакт');
    expect(result).toEqual([
      { type: 'text', value: 'Учим ' },
      { type: 'hashtag', tag: 'реакт', slug: 'реакт' },
    ]);
  });

  it('handles underscores in hashtags', () => {
    const result = parseHashtags('#база_данных');
    expect(result).toEqual([{ type: 'hashtag', tag: 'база_данных', slug: 'база_данных' }]);
  });

  it('handles digits in hashtags', () => {
    const result = parseHashtags('#nextjs14');
    expect(result).toEqual([{ type: 'hashtag', tag: 'nextjs14', slug: 'nextjs14' }]);
  });

  it('preserves original casing in tag, normalizes slug', () => {
    const result = parseHashtags('#TypeScript');
    expect(result).toEqual([{ type: 'hashtag', tag: 'TypeScript', slug: 'typescript' }]);
  });

  it('does not match lone # symbol', () => {
    const result = parseHashtags('Price is # unknown');
    expect(result).toEqual([{ type: 'text', value: 'Price is # unknown' }]);
  });

  it('handles consecutive hashtags', () => {
    const result = parseHashtags('#react#vue');
    expect(result).toEqual([
      { type: 'hashtag', tag: 'react', slug: 'react' },
      { type: 'hashtag', tag: 'vue', slug: 'vue' },
    ]);
  });

  it('returns empty for empty string', () => {
    const result = parseHashtags('');
    expect(result).toEqual([]);
  });

  it('handles hashtag at end of text', () => {
    const result = parseHashtags('Learn #react');
    expect(result).toEqual([
      { type: 'text', value: 'Learn ' },
      { type: 'hashtag', tag: 'react', slug: 'react' },
    ]);
  });

  it('handles mixed latin and cyrillic hashtags', () => {
    const result = parseHashtags('#react и #реакт together');
    expect(result).toEqual([
      { type: 'hashtag', tag: 'react', slug: 'react' },
      { type: 'text', value: ' и ' },
      { type: 'hashtag', tag: 'реакт', slug: 'реакт' },
      { type: 'text', value: ' together' },
    ]);
  });
});
