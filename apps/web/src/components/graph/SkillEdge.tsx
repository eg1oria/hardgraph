'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { useGraphStore } from '@/stores/useGraphStore';

function SkillEdgeComponent({
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
          stroke: selected ? '#6366F1' : 'hsl(var(--border-light))',
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      {selected && (
        <foreignObject
          x={labelX - 12}
          y={labelY - 12}
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
            aria-label="Delete edge"
          >
            ×
          </button>
        </foreignObject>
      )}
    </g>
  );
}

export const SkillEdge = memo(SkillEdgeComponent);
