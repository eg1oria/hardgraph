'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/Toast';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useOnboardingStore } from '@/stores/useOnboardingStore';

function HydrateStores() {
  useEffect(() => {
    useOnboardingStore.getState().hydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ToastProvider>
        <HydrateStores />
        {children}
        <CommandPalette />
      </ToastProvider>
    </ThemeProvider>
  );
}
