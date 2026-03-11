'use client';

import { useCallback, useRef } from 'react';
import { useGraphStore, type GraphEdge } from '@/stores/useGraphStore';
import { useNodes } from '@/hooks/useNodes';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { normalizeTag } from '@/lib/hashtag-parser';

/**
 * Hook that returns a handler for hashtag clicks.
 * - If a node with a matching name exists in the current graph → selects it and creates an edge.
 * - Otherwise → creates a new node near the currently selected node, connects them, and selects it.
 */
export function useHashtagNavigation() {
  const { createNode } = useNodes();
  const { toast } = useToast();
  const busyRef = useRef(false);

  const handleTagClick = useCallback(
    async (tag: string, _slug: string) => {
      // Prevent concurrent clicks
      if (busyRef.current) return;
      busyRef.current = true;

      try {
        const state = useGraphStore.getState();
        const { nodes, edges, graphId, selectedNodeId } = state;
        const normalized = normalizeTag(tag);

        // Search for an existing node by normalized name (case-insensitive)
        const existing = nodes.find((n) => normalizeTag(n.name) === normalized);

        if (existing) {
          // Auto-connect current node → existing node
          if (selectedNodeId && selectedNodeId !== existing.id && graphId) {
            const edgeExists = edges.some(
              (e) =>
                (e.sourceNodeId === selectedNodeId && e.targetNodeId === existing.id) ||
                (e.sourceNodeId === existing.id && e.targetNodeId === selectedNodeId),
            );
            if (!edgeExists) {
              try {
                const res = await api.post<GraphEdge>(`/graphs/${graphId}/edges`, {
                  sourceNodeId: selectedNodeId,
                  targetNodeId: existing.id,
                  edgeType: 'dependency',
                });
                useGraphStore.getState().addEdge(res.data);
              } catch {
                toast('Failed to create edge', 'error');
              }
            }
          }
          useGraphStore.getState().setSelectedNode(existing.id);
          return;
        }

        // Calculate position near the current node
        const currentNode = nodes.find((n) => n.id === selectedNodeId);
        const positionX = (currentNode?.positionX ?? 100) + 250;
        const positionY = (currentNode?.positionY ?? 100) + 50;

        // Create new node
        const newNode = await createNode({
          name: tag,
          nodeType: 'skill',
          positionX,
          positionY,
          level: 'beginner',
        });

        if (newNode) {
          // Auto-connect current node → new node
          const latestState = useGraphStore.getState();
          if (selectedNodeId && latestState.graphId) {
            try {
              const res = await api.post<GraphEdge>(`/graphs/${latestState.graphId}/edges`, {
                sourceNodeId: selectedNodeId,
                targetNodeId: newNode.id,
                edgeType: 'dependency',
              });
              useGraphStore.getState().addEdge(res.data);
            } catch {
              toast('Failed to create edge', 'error');
            }
          }
          useGraphStore.getState().setSelectedNode(newNode.id);
        }
      } finally {
        busyRef.current = false;
      }
    },
    [createNode, toast],
  );

  return { handleTagClick };
}
