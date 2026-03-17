import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublic } from '@/lib/api';
import { PublicGraphViewer } from './viewer';

interface PublicGraph {
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
  customStyles?: Record<string, unknown>;
  forkedFrom?: {
    id: string;
    slug: string;
    title: string;
    user: { username: string };
  } | null;
}

interface Props {
  params: { username: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  try {
    const graph = await fetchPublic<PublicGraph>(`/public/${params.username}/${params.slug}`, 0);
    const author = graph.user.displayName || graph.user.username;
    const ogImageUrl = `${apiUrl}/og-image/${encodeURIComponent(params.username)}/${encodeURIComponent(params.slug)}.png`;
    return {
      title: `${graph.title} by ${author} — HardGraph`,
      description: graph.description || `${graph.title} — a skill tree by ${author}`,
      openGraph: {
        title: `${graph.title} — HardGraph`,
        description: graph.description || `Interactive skill tree by ${author}`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${graph.title} skill tree`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${graph.title} — HardGraph`,
        description: graph.description || `Interactive skill tree by ${author}`,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: 'Skill Tree — HardGraph' };
  }
}

export default async function PublicGraphPage({ params }: Props) {
  let graph: PublicGraph;
  try {
    graph = await fetchPublic<PublicGraph>(`/public/${params.username}/${params.slug}`, 0);
  } catch {
    notFound();
  }

  return <PublicGraphViewer graph={graph} />;
}
