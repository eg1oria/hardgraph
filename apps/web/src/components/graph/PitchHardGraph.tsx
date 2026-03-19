'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  type NodeTypes,
  type EdgeTypes,
  type NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '@/stores/useGraphStore';
import { injectXyflowHelpers } from '@/stores/useGraphStore';
import { PitchSkillNode } from './PitchSkillNode';
import { RepoNode } from './RepoNode';
import { SkillEdge } from './SkillEdge';
import { EvolutionEdge } from './EvolutionEdge';

injectXyflowHelpers(applyNodeChanges as never, applyEdgeChanges as never);

const nodeTypes: NodeTypes = {
  skill: PitchSkillNode,
  repository: RepoNode,
};

const edgeTypes: EdgeTypes = {
  skill: SkillEdge,
  evolution: EvolutionEdge,
};

export function PitchHardGraph() {
  const rfNodes = useGraphStore((s) => s.rfNodes);
  const rfEdges = useGraphStore((s) => s.rfEdges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setSelectedEdge = useGraphStore((s) => s.setSelectedEdge);
  const pitchData = useGraphStore((s) => s.pitchData);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  // In pitch mode, only allow selection changes
  const handleReadonlyNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const selectOnly = changes.filter((c) => c.type === 'select');
      if (selectOnly.length > 0) onNodesChange(selectOnly);
    },
    [onNodesChange],
  );

  // Dim edges connected to bonus nodes
  const styledEdges = useMemo(() => {
    if (!pitchData) return rfEdges;
    const nodeMatchMap = pitchData.nodeMatchMap;
    return rfEdges.map((edge) => {
      const sourceStatus = nodeMatchMap[edge.source];
      const targetStatus = nodeMatchMap[edge.target];
      if (sourceStatus === 'bonus' || targetStatus === 'bonus') {
        return {
          ...edge,
          style: { ...((edge.style as Record<string, unknown>) ?? {}), opacity: 0.15 },
        };
      }
      return edge;
    });
  }, [rfEdges, pitchData]);

  const defaultEdgeOptions = useMemo(() => ({ type: 'skill', animated: false }), []);
  const fitViewOpts = useMemo(() => ({ padding: 0.3 }), []);

  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
        <ReactFlow
          nodes={rfNodes}
          edges={styledEdges}
          onNodesChange={handleReadonlyNodesChange}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          fitView
          fitViewOptions={fitViewOpts}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background gap={24} size={1} color="hsl(var(--border))" />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
