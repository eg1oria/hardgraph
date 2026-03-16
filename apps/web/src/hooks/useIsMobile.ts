'use client';

import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  // Start with false (matches SSR output) — real value is set after hydration
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    setHydrated(true);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  // Until hydrated, return false (consistent with SSR)
  return hydrated ? isMobile : false;
}
