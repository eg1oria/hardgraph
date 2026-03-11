import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-primary hover:bg-primary-600 text-white': variant === 'primary',
          'bg-surface border border-border hover:border-border-light text-foreground':
            variant === 'secondary',
          'hover:bg-surface-light text-muted-foreground hover:text-foreground': variant === 'ghost',
          'bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20':
            variant === 'danger',
        },
        {
          'text-xs px-2.5 py-1.5 min-h-[36px]': size === 'sm',
          'text-sm px-4 py-2.5 min-h-[44px]': size === 'md',
          'text-base px-6 py-3 min-h-[48px]': size === 'lg',
        },
        'active:scale-[0.98]',
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
