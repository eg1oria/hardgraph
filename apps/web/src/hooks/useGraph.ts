import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useGraphStore, type GraphNode, type GraphEdge, type Category } from '@/stores/useGraphStore';
import { useToast } from '@/components/ui/Toast';

export function useGraph(graphId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setGraph = useGraphStore((s) => s.setGraph);
  const { toast } = useToast();

  useEffect(() => {
    if (!graphId || graphId === 'new') {
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get(`/graphs/${graphId}`)
      .then((res) => {
        const g = res.data as Record<string, unknown>;
        setGraph({
          id: g.id as string,
          title: g.title as string,
          slug: g.slug as string,
          isPublic: g.isPublic as boolean,
          nodes: (g.nodes ?? []) as GraphNode[],
          edges: (g.edges ?? []) as GraphEdge[],
          categories: (g.categories ?? []) as Category[],
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
