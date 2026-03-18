'use client';

import { useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from 'next-themes';
import { useReportWebVitals } from 'next/web-vitals';
import { ToastProvider } from '@/components/ui/Toast';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { reportWebVitals } from '@/lib/reportWebVitals';

// Lazy-load CommandPalette — not needed for initial render (Lighthouse: reduce unused JS)
const CommandPalette = lazy(() =>
  import('@/components/ui/CommandPalette').then((m) => ({ default: m.CommandPalette })),
);

function HydrateStores() {
  useEffect(() => {
    useOnboardingStore.getState().hydrate();
  }, []);
  return null;
}

function WebVitals() {
  useReportWebVitals(reportWebVitals);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ToastProvider>
        <HydrateStores />
        <WebVitals />
        {children}
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </ToastProvider>
    </ThemeProvider>
  );
}
