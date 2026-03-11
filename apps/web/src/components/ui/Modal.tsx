'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Track nested modals to avoid premature overflow restore
let openModalCount = 0;

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      openModalCount++;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (open) {
        openModalCount--;
        if (openModalCount <= 0) {
          openModalCount = 0;
          document.body.style.overflow = '';
        }
      }
    };
  }, [open]);

  // ESC key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const modal = contentRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // Auto-focus first focusable element on open
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const modal = contentRef.current;
      if (!modal) return;
      const autofocus = modal.querySelector<HTMLElement>('[autofocus]');
      if (autofocus) {
        autofocus.focus();
        return;
      }
      const first = modal.querySelector<HTMLElement>(
        'input, textarea, select, button:not([disabled])',
      );
      first?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className={cn(
          'relative w-full max-w-md mx-4 p-5 sm:p-6 rounded-xl bg-surface border border-border shadow-2xl animate-fade-in max-h-[min(90vh,calc(100dvh-2rem))] overflow-y-auto',
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold pr-8">{title}</h2>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg hover:bg-surface-light active:bg-surface-light text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-1.5"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
