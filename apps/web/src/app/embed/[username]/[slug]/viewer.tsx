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
  const author = graph.user.displayName || graph.user.username;

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      <ReactFlowProvider>
        <div className="flex-1 relative">
          <HardGraph readonly />
        </div>
      </ReactFlowProvider>

      {/* CTA Footer — minimal, elegant */}
      <div className="h-11 border-t border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Logo mark */}
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none" className="shrink-0 opacity-50">
            <polygon points="8,1 14.93,5 14.93,13 8,17 1.07,13 1.07,5" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400" />
          </svg>
          <Link
            href={graphUrl}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            {graph.title}
            <span className="font-normal opacity-60"> by {author}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
            Powered by HardGraph
          </span>
          <Link
            href="/signup"
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
            target="_blank"
            rel="noopener noreferrer"
          >
            Create yours →
          </Link>
        </div>
      </div>
    </div>
  );
}
