import React from 'react';

// UX: Unified markdown renderer used by Read page, New/Edit preview, and comments

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 bg-surface-light rounded text-sm font-mono text-primary-400"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // eslint-disable-next-line no-useless-escape
    const nextSpecial = remaining.search(/[`*\[]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts.length === 1 ? parts[0] : parts;
}

export interface TocHeading {
  level: number;
  text: string;
  id: string;
}

/** Extract headings from markdown for Table of Contents */
export function extractHeadings(md: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const lines = md.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const text = match[2]!.replace(/[*`[\]]/g, '');
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      headings.push({ level: match[1]!.length, text, id });
    }
  }
  return headings;
}

/** Render markdown string to React nodes */
export function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Code blocks
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++;
      elements.push(
        <pre
          key={elements.length}
          className="bg-surface-light rounded-lg p-4 overflow-x-auto my-6 text-sm font-mono border border-border"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    // Headings with ids for ToC anchors
    if (line.startsWith('### ')) {
      const text = line.slice(4);
      const plainText = text.replace(/[*`[\]]/g, '');
      const id = plainText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      elements.push(
        <h3
          key={elements.length}
          id={id}
          className="text-lg font-semibold mt-8 mb-2 text-foreground scroll-mt-20"
        >
          {inlineFormat(text)}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      const text = line.slice(3);
      const plainText = text.replace(/[*`[\]]/g, '');
      const id = plainText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      elements.push(
        <h2
          key={elements.length}
          id={id}
          className="text-xl font-bold mt-10 mb-3 text-foreground scroll-mt-20"
        >
          {inlineFormat(text)}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      const text = line.slice(2);
      const plainText = text.replace(/[*`[\]]/g, '');
      const id = plainText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      elements.push(
        <h1
          key={elements.length}
          id={id}
          className="text-2xl font-bold mt-10 mb-4 text-foreground scroll-mt-20"
        >
          {inlineFormat(text)}
        </h1>,
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i]!.match(/^[-*] /)) {
        items.push(<li key={items.length}>{inlineFormat(lines[i]!.slice(2))}</li>);
        i++;
      }
      elements.push(
        <ul
          key={elements.length}
          className="list-disc list-inside my-4 space-y-1.5 text-muted-foreground"
        >
          {items}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i]!.match(/^\d+\. /)) {
        items.push(<li key={items.length}>{inlineFormat(lines[i]!.replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      elements.push(
        <ol
          key={elements.length}
          className="list-decimal list-inside my-4 space-y-1.5 text-muted-foreground"
        >
          {items}
        </ol>,
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.startsWith('> ')) {
        quoteLines.push(lines[i]!.slice(2));
        i++;
      }
      elements.push(
        <blockquote
          key={elements.length}
          className="border-l-2 border-border pl-4 my-6 text-muted-foreground italic"
        >
          {quoteLines.map((ql, idx) => (
            <p key={idx}>{inlineFormat(ql)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={elements.length} className="my-4 text-muted-foreground leading-[1.8]">
        {inlineFormat(line)}
      </p>,
    );
    i++;
  }

  return elements;
}
