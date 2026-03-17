import type { Metadata } from 'next';
import { fetchPublic } from '@/lib/api';
import { ScanResultView } from '@/components/scan/ScanResultView';

interface ScanResult {
  username: string;
  avatarUrl: string;
  totalRepos: number;
  totalLanguages: number;
  totalSkills: number;
  categories: Array<{
    name: string;
    color: string;
    skills: Array<{
      name: string;
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      source: string;
      weight: number;
    }>;
    score: number;
  }>;
  topSkills: string[];
  scannedAt: string;
}

interface PageProps {
  params: { username: string };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = params;
  return {
    title: `${username}'s Skill Tree — HardGraph`,
    description: `See ${username}'s developer skills analyzed from their GitHub profile`,
    openGraph: {
      title: `${username}'s GitHub Skill Tree`,
      description: `${username}'s developer skills analyzed from GitHub`,
      images: [`${API_URL}/og-image/scan/${username}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${username}'s GitHub Skill Tree`,
      images: [`${API_URL}/og-image/scan/${username}`],
    },
  };
}

export default async function ScanResultPage({ params }: PageProps) {
  const result = await fetchPublic<ScanResult>(`/scan/${params.username}`, 3600);
  return <ScanResultView result={result} />;
}
