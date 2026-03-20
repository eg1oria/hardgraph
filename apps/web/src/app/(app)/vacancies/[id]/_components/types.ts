export interface VacancyDetail {
  id: string;
  authorId: string;
  title: string;
  company: string | null;
  description: string | null;
  field: string | null;
  location: string | null;
  salaryRange: string | null;
  skills: { name: string; level: string; category?: string; categoryColor?: string }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface PublicGraph {
  id: string;
  title: string;
  slug: string;
  field: string | null;
  user: { username: string; displayName: string | null; avatarUrl: string | null };
  _count: { nodes: number };
}

export interface CompareResult {
  vacancyId: string;
  vacancyTitle: string;
  graphId: string;
  graphSlug: string;
  graphTitle: string;
  candidateUsername: string;
  candidateDisplayName: string | null;
  candidateAvatarUrl: string | null;
  matchScore: number;
  totalRequired: number;
  matchedCount: number;
  upgradeCount: number;
  missingCount: number;
  bonusCount: number;
  skills: {
    name: string;
    category?: string;
    categoryColor?: string;
    candidateLevel: string | null;
    requiredLevel: string;
    status: 'matched' | 'upgrade' | 'missing';
  }[];
  bonusSkills: { name: string; level: string; category?: string }[];
  categoryBreakdown: {
    name: string;
    color: string;
    matchScore: number;
    matched: number;
    total: number;
  }[];
}

export interface MyGraph {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  _count: { nodes: number };
}

export interface ApplicationStatus {
  id: string;
  status: string;
}

export interface RecentApplication {
  id: string;
  matchScore: number;
  status: string;
  createdAt: string;
  applicant: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  graph: { id: string; title: string; slug: string };
}

export interface ApplicationItem {
  id: string;
  vacancyId: string;
  applicantId: string;
  graphId: string;
  coverLetter: string | null;
  status: string;
  matchScore: number;
  matchedSkills: number;
  totalRequired: number;
  hrNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  applicant: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  graph: { id: string; title: string; slug: string };
}

export const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

export function getScoreBg(score: number) {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}
