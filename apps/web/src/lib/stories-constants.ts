import { Target, TrendingUp, RefreshCw, Wrench, Users, BookOpen, Circle } from 'lucide-react';

// UX: Centralized constants shared across all stories pages

export const CATEGORIES = [
  { value: '', label: 'All', icon: null },
  { value: 'got_offer', label: 'Got an Offer', icon: Target },
  { value: 'career_growth', label: 'Career Growth', icon: TrendingUp },
  { value: 'switched_field', label: 'Switched Field', icon: RefreshCw },
  { value: 'side_project', label: 'Side Project', icon: Wrench },
  { value: 'mentorship', label: 'Mentorship', icon: Users },
  { value: 'learning', label: 'Learning Path', icon: BookOpen },
  { value: 'other', label: 'Other', icon: Circle },
] as const;

export const EDITOR_CATEGORIES = CATEGORIES.filter((c) => c.value !== '');

export const FIELDS = [
  { value: '', label: 'All Fields' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Design', label: 'Design' },
  { value: 'Business', label: 'Business' },
  { value: 'Creative', label: 'Creative' },
  { value: 'Professional', label: 'Professional' },
] as const;

export const EDITOR_FIELDS = [
  { value: '', label: 'Select field (optional)' },
  ...FIELDS.filter((f) => f.value !== ''),
] as const;

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'most_liked', label: 'Most Liked' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  got_offer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  career_growth: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  switched_field: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  side_project: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  mentorship: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  learning: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const CATEGORY_LABELS: Record<string, string> = {
  got_offer: 'Got an Offer',
  career_growth: 'Career Growth',
  switched_field: 'Switched Field',
  side_project: 'Side Project',
  mentorship: 'Mentorship',
  learning: 'Learning Path',
  other: 'Other',
};

export const POPULAR_TAGS = [
  'frontend',
  'backend',
  'fullstack',
  'devops',
  'mobile',
  'ai',
  'machine-learning',
  'data-science',
  'design',
  'product',
  'management',
  'interview',
  'resume',
  'salary',
  'remote',
  'startup',
  'freelance',
  'mentorship',
  'career-switch',
  'junior',
  'senior',
  'medicine',
  'business',
  'creative',
];

export function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateLong(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadTime(text: string) {
  return Math.max(1, Math.ceil(wordCount(text) / 200));
}
