import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useGraphStore, type GraphNode, type GraphEdge } from '@/stores/useGraphStore';
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

interface EvolveResult {
  node: GraphNode;
  edge: GraphEdge;
}

interface EvolutionChainNode {
  id: string;
  name: string;
  description?: string;
  level: string;
  nodeType: string;
  icon?: string;
  parentIdeaId: string | null;
  createdAt: string;
}

interface EvolutionChainResult {
  rootId: string;
  currentNodeId: string;
  chain: EvolutionChainNode[];
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

  const evolveNode = useCallback(
    async (id: string, data?: { name?: string; description?: string }) => {
      try {
        const res = await api.post<EvolveResult>(`/nodes/${id}/evolve`, data ?? {});
        const { node, edge } = res.data;
        useGraphStore.getState().addNode({ ...node, isUnlocked: node.isUnlocked ?? true });
        useGraphStore.getState().addEdge(edge);
        useGraphStore.getState().setSelectedNode(node.id);
        toast('Idea evolved!', 'success');
        return res.data;
      } catch {
        toast('Failed to evolve idea', 'error');
      }
    },
    [toast],
  );

  const getEvolutionChain = useCallback(
    async (id: string) => {
      try {
        const res = await api.get<EvolutionChainResult>(`/nodes/${id}/evolution-chain`);
        return res.data;
      } catch {
        return null;
      }
    },
    [],
  );

  return { createNode, editNode, deleteNode, batchUpdatePositions, evolveNode, getEvolutionChain };
}
