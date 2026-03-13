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
}

interface Props {
  params: { username: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const graph = await fetchPublic<PublicGraph>(`/public/${params.username}/${params.slug}`, 0);
    const author = graph.user.displayName || graph.user.username;
    return {
      title: `${graph.title} by ${author} — HardGraph`,
      description: graph.description || `${graph.title} — a skill tree by ${author}`,
      openGraph: {
        title: `${graph.title} — HardGraph`,
        description: graph.description || `Interactive skill tree by ${author}`,
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
