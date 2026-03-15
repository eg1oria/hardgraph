'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Link from 'next/link';

import { HardGraph } from '@/components/graph/HardGraph';
import { useGraphStore } from '@/stores/useGraphStore';

interface GraphData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  theme: string;
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

export function EmbedViewer({ graph }: { graph: GraphData }) {
  const setGraph = useGraphStore((s) => s.setGraph);

  useEffect(() => {
    setGraph({
      id: graph.id,
      title: graph.title,
      slug: graph.slug,
      isPublic: true,
      nodes: graph.nodes,
      edges: graph.edges,
      categories: graph.categories,
    });
  }, [graph, setGraph]);

  const graphUrl = `/${graph.user.username}/${graph.slug}`;

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <ReactFlowProvider>
        <div className="flex-1 relative">
          <HardGraph readonly />
        </div>
      </ReactFlowProvider>

      {/* CTA Footer */}
      <div className="h-10 border-t border-border bg-surface flex items-center justify-center gap-2 px-4 shrink-0">
        <span className="text-xs text-muted-foreground">⬡</span>
        <span className="text-xs text-muted-foreground">
          <Link
            href={graphUrl}
            className="text-primary-400 hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            {graph.title}
          </Link>
          {' · Made with '}
          <Link
            href="/"
            className="text-primary-400 hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            HardGraph
          </Link>
          {' — '}
          <Link
            href="/signup"
            className="text-foreground hover:underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Create yours free
          </Link>
        </span>
      </div>
    </div>
  );
}
