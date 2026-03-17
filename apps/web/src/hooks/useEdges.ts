import { useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useGraphStore, type GraphEdge } from '@/stores/useGraphStore';
import { useToast } from '@/components/ui/Toast';

export function useEdges() {
  const graphId = useGraphStore((s) => s.graphId);
  const pendingConnection = useGraphStore((s) => s.pendingConnection);
  const pendingDeleteEdgeId = useGraphStore((s) => s.pendingDeleteEdgeId);
  const { toast } = useToast();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // When a connection is made on the canvas, create it on the backend
  useEffect(() => {
    if (!pendingConnection || !graphId) return;
    const { source, target } = pendingConnection;

    // Clear immediately so new connections can be queued while this one is in-flight
    useGraphStore.getState().setPendingConnection(null);

    if (!source || !target) return;

    (async () => {
      try {
        const res = await api.post<GraphEdge>(`/graphs/${graphId}/edges`, {
          sourceNodeId: source,
          targetNodeId: target,
          edgeType: 'dependency',
        });
        if (!mountedRef.current) return;
        useGraphStore.getState().addEdge(res);
        useGraphStore.getState().touchUpdatedAt();
      } catch {
        if (!mountedRef.current) return;
        toast('Failed to create edge', 'error');
      }
    })();
  }, [pendingConnection, graphId, toast]);

  const deleteEdge = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/edges/${id}`);
        useGraphStore.getState().removeEdge(id);
        useGraphStore.getState().touchUpdatedAt();
      } catch {
        toast('Failed to delete edge', 'error');
      }
    },
    [toast],
  );

  // Handle pending edge deletion from edge component
  useEffect(() => {
    if (!pendingDeleteEdgeId) return;
    const edgeId = pendingDeleteEdgeId;
    useGraphStore.setState({ pendingDeleteEdgeId: null });
    deleteEdge(edgeId);
  }, [pendingDeleteEdgeId, deleteEdge]);

  return { deleteEdge };
}
