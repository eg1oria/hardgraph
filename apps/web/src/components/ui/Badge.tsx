import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'muted';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-surface-light text-muted-foreground': variant === 'default',
          'bg-primary/10 text-primary-400': variant === 'primary',
          'bg-accent/10 text-accent-400': variant === 'accent',
          'bg-surface-light text-muted': variant === 'muted',
        },
        className,
      )}
    >
      {children}
    </span>
  );
}
