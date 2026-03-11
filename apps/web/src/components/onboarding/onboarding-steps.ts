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
    title: 'Навигация',
    description:
      'Здесь находится главное меню. Переключайтесь между дашбордом, шаблонами, исследованием и настройками. Sidebar можно свернуть для экономии места.',
    placement: 'right',
    icon: PanelLeft,
  },
  {
    id: 'explore',
    target: '[data-onboarding="explore"]',
    title: 'Explore — исследуйте',
    description:
      'Откройте для себя скилл-деревья других пользователей. Вдохновляйтесь, учитесь и находите интересные структуры навыков.',
    placement: 'right',
    icon: Compass,
  },
  {
    id: 'search',
    target: '[data-onboarding="search"]',
    title: 'Быстрый поиск',
    description:
      'Используйте Ctrl+K (⌘K на Mac) для вызова командной палитры. Быстро находите графы, переходите между разделами и выполняйте действия.',
    placement: 'bottom',
    icon: Search,
  },
  {
    id: 'create-graph',
    target: '[data-onboarding="create-graph"]',
    title: 'Создайте свой первый граф',
    description:
      'Нажмите эту кнопку, чтобы создать новое скилл-дерево. Добавляйте навыки как ноды и связывайте их между собой.',
    placement: 'bottom',
    icon: Plus,
  },
  {
    id: 'templates',
    target: '[data-onboarding="templates"]',
    title: 'Шаблоны',
    description:
      'Используйте готовые шаблоны скилл-деревьев, чтобы быстро начать. Импортируйте структуру и настройте под себя.',
    placement: 'right',
    icon: BookTemplate,
  },
];
