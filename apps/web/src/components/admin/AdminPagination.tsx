'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  total: number;
  take: number;
  skip: number;
  onPageChange: (skip: number) => void;
}

export function AdminPagination({ total, take, skip, onPageChange }: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / take));
  const currentPage = Math.floor(skip / take) + 1;

  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        {skip + 1}–{Math.min(skip + take, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(0, skip - take))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-xs">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange((page - 1) * take)}
              className={`min-w-[32px] h-8 rounded-md text-xs font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary/10 text-primary-400'
                  : 'hover:bg-surface-light text-muted-foreground hover:text-foreground'
              }`}
            >
              {page}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(skip + take)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
