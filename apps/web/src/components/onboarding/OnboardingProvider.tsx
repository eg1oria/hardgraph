'use client';

import { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { OnboardingOverlay } from './OnboardingOverlay';
import { onboardingSteps } from './onboarding-steps';

/**
 * Drop this into your app layout.
 * It auto-starts the guide tour for first-time users
 * and renders the overlay when active.
 */
export function OnboardingProvider() {
  const { isActive, hasSeenGuide, hydrate, start, currentStep, next, complete } =
    useOnboardingStore();
  const user = useAuthStore((s) => s.user);

  // Hydrate from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Auto-start for first-time users after onboarding flow is completed
  useEffect(() => {
    if (!user || !user.onboardingCompleted) return;
    if (hasSeenGuide) return;

    // Small delay to let the DOM render all elements
    const timer = setTimeout(() => {
      start();
    }, 800);

    return () => clearTimeout(timer);
  }, [user, hasSeenGuide, start]);

  // Auto-skip steps whose target element is not in the DOM
  useEffect(() => {
    if (!isActive) return;

    const step = onboardingSteps[currentStep];
    if (!step) return;

    const checkTarget = () => {
      const el = document.querySelector(step.target);
      if (!el) {
        // Target not found, skip to next or complete
        if (currentStep < onboardingSteps.length - 1) {
          next();
        } else {
          complete();
        }
      }
    };

    // Check after a small delay to allow DOM to settle
    const timer = setTimeout(checkTarget, 100);
    return () => clearTimeout(timer);
  }, [isActive, currentStep, next, complete]);

  return <OnboardingOverlay />;
}
