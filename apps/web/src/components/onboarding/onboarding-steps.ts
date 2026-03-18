import type { LucideIcon } from 'lucide-react';
import { PanelLeft, Plus, BookTemplate, Search, Compass } from 'lucide-react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface OnboardingStep {
  /** Unique identifier */
  id: string;
  /** CSS selector for the target element (uses data-onboarding attribute) */
  target: string;
  /** Step title */
  title: string;
  /** Description text */
  description: string;
  /** Tooltip placement relative to target */
  placement: TooltipPlacement;
  /** Icon to show in the tooltip */
  icon: LucideIcon;
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 'sidebar',
    target: '[data-onboarding="sidebar"]',
    title: 'Navigation',
    description:
      'This is the main menu. Switch between dashboard, templates, explore, and settings. You can collapse the sidebar to save space.',
    placement: 'right',
    icon: PanelLeft,
  },
  {
    id: 'explore',
    target: '[data-onboarding="explore"]',
    title: 'Explore',
    description:
      'Discover skill trees from other professionals. Get inspired, learn, and find interesting skill structures.',
    placement: 'right',
    icon: Compass,
  },
  {
    id: 'search',
    target: '[data-onboarding="search"]',
    title: 'Quick Search',
    description:
      'Use Ctrl+K (⌘K on Mac) to open the command palette. Quickly find graphs, navigate between sections, and perform actions.',
    placement: 'bottom',
    icon: Search,
  },
  {
    id: 'create-graph',
    target: '[data-onboarding="create-graph"]',
    title: 'Create Your First Graph',
    description:
      'Click this button to create a new skill tree. Add skills as nodes and connect them together.',
    placement: 'bottom',
    icon: Plus,
  },
  {
    id: 'templates',
    target: '[data-onboarding="templates"]',
    title: 'Templates',
    description:
      'Use ready-made skill tree templates to get started quickly. Import the structure and customize it to your needs.',
    placement: 'right',
    icon: BookTemplate,
  },
];
