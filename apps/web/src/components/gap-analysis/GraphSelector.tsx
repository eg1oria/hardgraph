'use client';

import { useEffect, useState } from 'react';
import { Network } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface Graph {
  id: string;
  title: string;
  slug: string;
  isPublic: boolean;
  _count: { nodes: number; edges: number };
}

interface GraphSelectorProps {
  selectedId: string | null;
  onSelect: (graphId: string) => void;
}

export function GraphSelector({ selectedId, onSelect }: GraphSelectorProps) {
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Graph[]>('/graphs')
      .then(setGraphs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (graphs.length === 0) {
    return (
      <div className="card text-center py-8">
        <Network className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
        <p className="text-sm text-muted-foreground">
          No graphs yet. Create a skill graph first to analyze your gaps.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {graphs.map((graph) => {
        const isSelected = selectedId === graph.id;
        return (
          <button
            key={graph.id}
            onClick={() => onSelect(graph.id)}
            className={`card text-left transition-all ${
              isSelected
                ? 'ring-2 ring-primary border-primary/50'
                : 'hover:border-border-light cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Network className="w-4 h-4 text-primary shrink-0" />
              <h4 className="text-sm font-medium truncate">{graph.title}</h4>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span>{graph._count.nodes} nodes</span>
              <span>{graph._count.edges} edges</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
