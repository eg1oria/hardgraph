import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  const sizePixels = { sm: 32, md: 40, lg: 56 };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        width={sizePixels[size]}
        height={sizePixels[size]}
        loading="lazy"
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/20 text-primary-400 flex items-center justify-center font-medium',
        sizeClasses[size],
        className,
      )}
    >
      {fallback?.[0]?.toUpperCase() || '?'}
    </div>
  );
}
