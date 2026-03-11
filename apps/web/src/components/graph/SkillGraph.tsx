'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  type NodeTypes,
  type EdgeTypes,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '@/stores/useGraphStore';
import { SkillNode } from './SkillNode';
import { RepoNode } from './RepoNode';
import { SkillEdge } from './SkillEdge';
import { EvolutionEdge } from './EvolutionEdge';
import { GraphControls } from './GraphControls';
import { MiniMap } from './MiniMap';
import { useIsMobile } from '@/hooks/useIsMobile';

const nodeTypes: NodeTypes = {
  skill: SkillNode,
  repository: RepoNode,
};

const edgeTypes: EdgeTypes = {
  skill: SkillEdge,
  evolution: EvolutionEdge,
};

export function SkillGraph({ readonly }: { readonly?: boolean } = {}) {
  const isMobile = useIsMobile(1024);
  const rfNodes = useGraphStore((s) => s.rfNodes);
  const rfEdges = useGraphStore((s) => s.rfEdges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const setSelectedEdge = useGraphStore((s) => s.setSelectedEdge);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  // In readonly mode, only allow selection changes (no position/remove/etc.)
  const handleReadonlyNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const selectOnly = changes.filter((c) => c.type === 'select');
      if (selectOnly.length > 0) onNodesChange(selectOnly);
    },
    [onNodesChange],
  );

  const defaultEdgeOptions = useMemo(() => ({ type: 'skill', animated: false }), []);
  const fitViewOpts = useMemo(() => ({ padding: 0.3 }), []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={readonly ? handleReadonlyNodesChange : onNodesChange}
        onEdgesChange={readonly ? undefined : onEdgesChange}
        onConnect={readonly ? undefined : onConnect}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={!readonly}
        nodesConnectable={!readonly}
        elementsSelectable
        fitView
        fitViewOptions={fitViewOpts}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background gap={24} size={1} color="hsl(var(--border))" />
        <GraphControls />
        {!isMobile && <MiniMap />}
      </ReactFlow>
    </div>
  );
}
