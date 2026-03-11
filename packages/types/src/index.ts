// Shared types for Skillgraph

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  githubUsername?: string;
  plan: string;
  onboardingCompleted: boolean;
}

export interface GraphSummary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  theme: string;
  isPublic: boolean;
  viewCount: number;
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type NodeType = 'skill' | 'repository';

export type GraphTheme = 'cyberpunk' | 'minimal' | 'neon' | 'ocean' | 'forest' | 'sunset';

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}
