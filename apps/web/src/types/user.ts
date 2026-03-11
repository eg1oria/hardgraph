export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  githubUsername?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  plan: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  githubUsername?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  createdAt: string;
  graphs: Array<{
    id: string;
    title: string;
    slug: string;
    description?: string;
    theme: string;
    viewCount: number;
    isPrimary: boolean;
    createdAt: string;
  }>;
}
