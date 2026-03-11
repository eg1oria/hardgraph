import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-xl bg-surface border border-border',
        hover && 'hover:border-border-light transition-all hover:glow-primary cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
