'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="p-2 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  );
}
