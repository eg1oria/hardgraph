import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import {
  useGraphStore,
  type GraphNode,
  type GraphEdge,
  type Category,
} from '@/stores/useGraphStore';
import { useToast } from '@/components/ui/Toast';

export function useGraph(graphId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setGraph = useGraphStore((s) => s.setGraph);
  const { toast } = useToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!graphId || graphId === 'new') {
      setLoading(false);
      return;
    }

    setLoading(true);
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
      }>(`/graphs/${graphId}`)
      .then((g) => {
        if (!mountedRef.current) return;
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
      })
      .catch((err: unknown) => {
        if (!mountedRef.current) return;
        const message = err instanceof Error ? err.message : 'Failed to load graph';
        setError(message);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
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

  return { loading, error, saveGraph };
}
