import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublic } from '@/lib/api';
import { PitchGraphViewer } from './viewer';

interface PitchGraph {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  theme: string;
  viewCount: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  nodes: Array<{
    id: string;
    name: string;
    description?: string;
    level: string;
    nodeType?: string;
    icon?: string;
    positionX: number;
    positionY: number;
    categoryId?: string;
    isUnlocked: boolean;
    customData?: Record<string, unknown>;
    endorsementCount?: number;
  }>;
  edges: Array<{
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    label?: string;
    edgeType: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    color?: string;
    sortOrder: number;
  }>;
  forkCount: number;
  pitchData: {
    vacancyId: string;
    vacancyTitle: string;
    company: string | null;
    matchScore: number;
    matchedCount: number;
    upgradeCount: number;
    missingCount: number;
    totalRequired: number;
    nodeMatchMap: Record<string, 'matched' | 'upgrade' | 'bonus' | null>;
    missingSkills: Array<{
      name: string;
      requiredLevel: string;
      category?: string;
      categoryColor?: string;
    }>;
    categoryBreakdown: Array<{
      name: string;
      color: string;
      matchScore: number;
      matched: number;
      total: number;
    }>;
  };
}

interface Props {
  params: { username: string; slug: string };
  searchParams: { vacancy?: string };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const vacancyId = searchParams.vacancy;
  if (!vacancyId) return { title: 'Pitch — HardGraph' };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  try {
    const graph = await fetchPublic<PitchGraph>(
      `/public/${params.username}/${params.slug}/pitch?vacancyId=${encodeURIComponent(vacancyId)}`,
      0,
    );
    const author = graph.user.displayName || graph.user.username;
    const pitch = graph.pitchData;
    const ogImageUrl = `${apiUrl}/og-image/${encodeURIComponent(params.username)}/${encodeURIComponent(params.slug)}.png`;

    const title = `${author}'s Skills — ${pitch.matchScore}% Match for ${pitch.vacancyTitle}`;
    const description = `${pitch.matchedCount} of ${pitch.totalRequired} required skills matched. Interactive skill graph pitch.`;

    return {
      title: `${title} — HardGraph`,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${author}'s skill graph pitch`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: 'Pitch — HardGraph' };
  }
}

export default async function PitchPage({ params, searchParams }: Props) {
  const vacancyId = searchParams.vacancy;
  if (!vacancyId) notFound();

  let graph: PitchGraph;
  try {
    graph = await fetchPublic<PitchGraph>(
      `/public/${params.username}/${params.slug}/pitch?vacancyId=${encodeURIComponent(vacancyId)}`,
      0,
    );
  } catch {
    notFound();
  }

  return <PitchGraphViewer graph={graph} />;
}
