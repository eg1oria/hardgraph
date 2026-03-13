'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChevronsUp } from 'lucide-react';
import type { SkillNodeData } from '@/stores/useGraphStore';
import { NODE_COLORS } from '@/lib/constants';
import type { SkillLevel } from '@/lib/constants';
import { useGraphStore } from '@/stores/useGraphStore';
import { HashtagText } from '@/components/graph/HashtagText';

function SkillNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as SkillNodeData;
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const borderColor = d.categoryColor ?? NODE_COLORS[d.level as SkillLevel] ?? '#6366F1';

  return (
    <div
      onClick={() => setSelectedNode(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedNode(id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Node: ${d.name}`}
      className={`group relative px-4 py-3 rounded-xl border-2 bg-surface min-w-[120px] max-w-[200px] transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected
          ? 'shadow-lg shadow-primary/20 scale-105'
          : 'hover:shadow-md hover:shadow-primary/10 active:scale-[0.97]'
      }`}
      style={{ borderColor: selected ? borderColor : `${borderColor}66` }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-border !border-surface after:content-[''] after:absolute after:-inset-2 after:rounded-full"
      />

      <div className="flex items-center gap-2 mb-1">
        <ChevronsUp className="w-4 h-4 shrink-0" style={{ color: borderColor }} strokeWidth={1} />

        <span className="text-sm font-semibold truncate">{d.name}</span>
      </div>

      {d.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          <HashtagText text={d.description} />
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-2">
        <span
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: NODE_COLORS[d.level as SkillLevel] ?? '#6366F1' }}
        />
        <span className="text-[10px] text-muted capitalize">{d.level}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-border !border-surface after:content-[''] after:absolute after:-inset-2 after:rounded-full"
      />
    </div>
  );
}

export const SkillNode = memo(SkillNodeComponent);
