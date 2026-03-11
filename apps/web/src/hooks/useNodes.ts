import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useGraphStore, type GraphNode } from '@/stores/useGraphStore';
import { useToast } from '@/components/ui/Toast';

interface CreateNodePayload {
  name: string;
  description?: string;
  level: string;
  nodeType?: string;
  icon?: string;
  positionX: number;
  positionY: number;
  categoryId?: string;
  customData?: Record<string, unknown>;
}

export function useNodes() {
  const graphId = useGraphStore((s) => s.graphId);
  const { toast } = useToast();

  const createNode = useCallback(
    async (data: CreateNodePayload) => {
      if (!graphId) return;
      try {
        const res = await api.post<GraphNode>(`/graphs/${graphId}/nodes`, data);
        useGraphStore.getState().addNode({ ...res.data, isUnlocked: true });
        return res.data;
      } catch {
        toast('Failed to create node', 'error');
      }
    },
    [graphId, toast],
  );

  const editNode = useCallback(
    async (id: string, data: Partial<GraphNode>) => {
      try {
        await api.put(`/nodes/${id}`, data);
        useGraphStore.getState().updateNode(id, data);
      } catch {
        toast('Failed to update node', 'error');
      }
    },
    [toast],
  );

  const deleteNode = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/nodes/${id}`);
        useGraphStore.getState().removeNode(id);
      } catch {
        toast('Failed to delete node', 'error');
      }
    },
    [toast],
  );

  const batchUpdatePositions = useCallback(
    async (updates: Array<{ id: string; positionX: number; positionY: number }>) => {
      if (!graphId) return;
      try {
        await api.put(`/nodes/batch`, { nodes: updates });
      } catch {
        // Silent fail for position saves — the store already has the positions
      }
    },
    [graphId],
  );

  return { createNode, editNode, deleteNode, batchUpdatePositions };
}
