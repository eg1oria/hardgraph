import { useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useGraphStore, type GraphEdge } from '@/stores/useGraphStore';
import { useToast } from '@/components/ui/Toast';

export function useEdges() {
  const graphId = useGraphStore((s) => s.graphId);
  const pendingConnection = useGraphStore((s) => s.pendingConnection);
  const pendingDeleteEdgeId = useGraphStore((s) => s.pendingDeleteEdgeId);
  const { toast } = useToast();
  const creatingEdge = useRef(false);

  // When a connection is made on the canvas, create it on the backend
  useEffect(() => {
    if (!pendingConnection || !graphId || creatingEdge.current) return;
    const { source, target } = pendingConnection;
    if (!source || !target) {
      useGraphStore.getState().setPendingConnection(null);
      return;
    }

    creatingEdge.current = true;
    (async () => {
      try {
        const res = await api.post<GraphEdge>(`/graphs/${graphId}/edges`, {
          sourceNodeId: source,
          targetNodeId: target,
          edgeType: 'dependency',
        });
        useGraphStore.getState().addEdge(res);
      } catch {
        toast('Failed to create edge', 'error');
      } finally {
        useGraphStore.getState().setPendingConnection(null);
        creatingEdge.current = false;
      }
    })();
  }, [pendingConnection, graphId, toast]);

  const deleteEdge = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/edges/${id}`);
        useGraphStore.getState().removeEdge(id);
      } catch {
        toast('Failed to delete edge', 'error');
      }
    },
    [toast],
  );

  // Handle pending edge deletion from edge component
  useEffect(() => {
    if (!pendingDeleteEdgeId) return;
    useGraphStore.setState({ pendingDeleteEdgeId: null });
    deleteEdge(pendingDeleteEdgeId);
  }, [pendingDeleteEdgeId, deleteEdge]);

  return { deleteEdge };
}
