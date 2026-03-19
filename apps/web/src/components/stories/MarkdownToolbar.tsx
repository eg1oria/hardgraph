'use client';

import { useCallback } from 'react';
import { Bold, Italic, Code, Link, Heading2, List, ListOrdered, Quote, Image } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

// UX: Markdown formatting toolbar that inserts syntax at cursor position

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (value: string) => void;
}

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const ACTIONS: ToolbarAction[] = [
  { icon: <Bold className="w-4 h-4" />, label: 'Bold', prefix: '**', suffix: '**' },
  { icon: <Italic className="w-4 h-4" />, label: 'Italic', prefix: '*', suffix: '*' },
  { icon: <Code className="w-4 h-4" />, label: 'Code', prefix: '`', suffix: '`' },
  { icon: <Link className="w-4 h-4" />, label: 'Link', prefix: '[', suffix: '](url)' },
  {
    icon: <Heading2 className="w-4 h-4" />,
    label: 'Heading',
    prefix: '## ',
    suffix: '',
    block: true,
  },
  { icon: <List className="w-4 h-4" />, label: 'List', prefix: '- ', suffix: '', block: true },
  {
    icon: <ListOrdered className="w-4 h-4" />,
    label: 'Ordered List',
    prefix: '1. ',
    suffix: '',
    block: true,
  },
  { icon: <Quote className="w-4 h-4" />, label: 'Quote', prefix: '> ', suffix: '', block: true },
  { icon: <Image className="w-4 h-4" />, label: 'Image', prefix: '![alt](', suffix: ')' },
];

export function MarkdownToolbar({ textareaRef, onInsert }: MarkdownToolbarProps) {
  const insertMarkdown = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const selected = value.slice(start, end);

      let newText: string;
      let cursorPos: number;

      if (action.block) {
        // Block-level: insert at line start
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const before = value.slice(0, lineStart);
        const after = value.slice(lineStart);
        newText = before + action.prefix + after;
        cursorPos = lineStart + action.prefix.length;
      } else if (selected) {
        newText =
          value.slice(0, start) + action.prefix + selected + action.suffix + value.slice(end);
        cursorPos = start + action.prefix.length + selected.length + action.suffix.length;
      } else {
        newText = value.slice(0, start) + action.prefix + action.suffix + value.slice(end);
        cursorPos = start + action.prefix.length;
      }

      onInsert(newText);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [textareaRef, onInsert],
  );

  return (
    <div
      className="flex items-center gap-0.5 p-1.5 border border-border rounded-lg bg-surface-light/50 flex-wrap"
      role="toolbar"
      aria-label="Markdown formatting"
    >
      {ACTIONS.map((action) => (
        <Tooltip key={action.label} content={action.label}>
          <button
            type="button"
            onClick={() => insertMarkdown(action)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-light transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
            aria-label={action.label}
          >
            {action.icon}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}
