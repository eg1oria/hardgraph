'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  items: DropdownItem[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Dropdown({
  items,
  value,
  onChange,
  placeholder = 'Select...',
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  const selected = items.find((i) => i.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setHighlightedIndex(-1);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < items.length) {
        onChange(items[highlightedIndex]!.value);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={cn('relative', className)} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm min-h-[44px] transition-colors hover:border-border-light focus:border-primary focus:ring-1 focus:ring-primary outline-none"
      >
        <span className={selected ? 'text-foreground' : 'text-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn('w-4 h-4 text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-xl overflow-hidden animate-in"
          role="listbox"
        >
          {items.map((item, index) => (
            <button
              key={item.value}
              role="option"
              aria-selected={item.value === value}
              onClick={() => {
                onChange(item.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-4 py-2.5 text-sm min-h-[44px] transition-colors',
                item.value === value
                  ? 'bg-primary/10 text-primary-400'
                  : highlightedIndex === index
                    ? 'bg-surface-light text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-light',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
