'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { useGraphStore } from '@/stores/useGraphStore';

function EvolutionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const setSelectedEdge = useGraphStore((s) => s.setSelectedEdge);
  const requestDeleteEdge = useGraphStore((s) => s.requestDeleteEdge);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <g onClick={() => setSelectedEdge(id)} className="cursor-pointer">
      {/* Invisible wider path for easier clicking */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#F59E0B' : '#A855F7',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '8 4',
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      {/* Arrow marker */}
      <defs>
        <marker
          id={`evolution-arrow-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={selected ? '#F59E0B' : '#A855F7'} />
        </marker>
      </defs>
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? '#F59E0B' : '#A855F7'}
        strokeWidth={selected ? 3 : 2}
        strokeDasharray="8 4"
        markerEnd={`url(#evolution-arrow-${id})`}
      />
      {/* Label */}
      <foreignObject
        x={labelX - 32}
        y={labelY - 10}
        width={64}
        height={20}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="text-[9px] text-center font-medium text-purple-400 bg-surface/80 rounded px-1 py-0.5 pointer-events-none">
          evolves
        </div>
      </foreignObject>
      {selected && (
        <foreignObject
          x={labelX - 12}
          y={labelY + 10}
          width={24}
          height={24}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              requestDeleteEdge(id);
            }}
            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold shadow-lg transition-colors"
            title="Delete edge"
            aria-label="Delete evolution edge"
          >
            ×
          </button>
        </foreignObject>
      )}
    </g>
  );
}

export const EvolutionEdge = memo(EvolutionEdgeComponent);
