import { create } from 'zustand';

const STORAGE_KEY = 'skillgraph_onboarding_guide_seen';

interface OnboardingState {
  /** Whether the guide tour is currently active */
  isActive: boolean;
  /** Current step index */
  currentStep: number;
  /** Whether the user has completed/dismissed the guide before */
  hasSeenGuide: boolean;
  /** Start the onboarding tour */
  start: () => void;
  /** Go to next step */
  next: () => void;
  /** Go to previous step */
  prev: () => void;
  /** Go to a specific step */
  goTo: (step: number) => void;
  /** Skip/dismiss the entire tour */
  skip: () => void;
  /** Complete the tour */
  complete: () => void;
  /** Reset (for testing or re-showing) */
  reset: () => void;
  /** Hydrate from localStorage */
  hydrate: () => void;
}

function markAsSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // SSR or storage unavailable
  }
}

function checkIfSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isActive: false,
  currentStep: 0,
  hasSeenGuide: false,

  start: () => set({ isActive: true, currentStep: 0 }),

  next: () =>
    set((state) => ({ currentStep: state.currentStep + 1 })),

  prev: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    })),

  goTo: (step) => set({ currentStep: step }),

  skip: () => {
    markAsSeen();
    set({ isActive: false, currentStep: 0, hasSeenGuide: true });
  },

  complete: () => {
    markAsSeen();
    set({ isActive: false, currentStep: 0, hasSeenGuide: true });
  },

  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ isActive: false, currentStep: 0, hasSeenGuide: false });
  },

  hydrate: () => {
    const seen = checkIfSeen();
    set({ hasSeenGuide: seen });
  },
}));
