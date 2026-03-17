import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  useGraphStore,
  type GraphNode,
  type GraphEdge,
  type Category,
} from '@/stores/useGraphStore';
import { useToast } from '@/components/ui/Toast';

export interface ForkedFromInfo {
  id: string;
  slug: string;
  title: string;
  user: { username: string };
}

export function useGraph(graphId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forkedFrom, setForkedFrom] = useState<ForkedFromInfo | null>(null);
  const setGraph = useGraphStore((s) => s.setGraph);
  const { toast } = useToast();

  useEffect(() => {
    const controller = new AbortController();

    if (!graphId || graphId === 'new') {
      setLoading(false);
      return () => {
        controller.abort();
      };
    }

    setLoading(true);
    setError(null);
    api
      .get<{
        id: string;
        title: string;
        slug: string;
        isPublic: boolean;
        updatedAt?: string;
        nodes?: GraphNode[];
        edges?: GraphEdge[];
        categories?: Category[];
        forkedFrom?: ForkedFromInfo | null;
      }>(`/graphs/${graphId}`, controller.signal)
      .then((g) => {
        if (controller.signal.aborted) return;
        setGraph({
          id: g.id,
          title: g.title,
          slug: g.slug,
          isPublic: g.isPublic,
          updatedAt: g.updatedAt,
          nodes: g.nodes ?? [],
          edges: g.edges ?? [],
          categories: g.categories ?? [],
        });
        setForkedFrom(g.forkedFrom ?? null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Failed to load graph';
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
      // Reset store to prevent stale graph data leaking to other pages
      useGraphStore.getState().reset();
    };
  }, [graphId, setGraph]);

  const saveGraph = useCallback(async () => {
    const state = useGraphStore.getState();
    if (!state.graphId) return;
    try {
      // Save node positions in batch
      const positions = state.nodes.map((n) => ({
        id: n.id,
        positionX: n.positionX,
        positionY: n.positionY,
      }));
      await api.put(`/nodes/batch`, { nodes: positions });
      useGraphStore.getState().setDirty(false);
      toast('Graph saved', 'success');
    } catch {
      toast('Failed to save graph', 'error');
    }
  }, [toast]);

  return { loading, error, saveGraph, forkedFrom };
}
