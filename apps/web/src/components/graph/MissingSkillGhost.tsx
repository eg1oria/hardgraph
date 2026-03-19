'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { SkillNodeData } from '@/stores/useGraphStore';
import { useGraphStore } from '@/stores/useGraphStore';

function MissingSkillGhostComponent({ id, data }: NodeProps) {
  const d = data as SkillNodeData;
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 0.6, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
      onClick={() => setSelectedNode(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedNode(id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Missing skill: ${d.name}`}
      className="group relative px-4 py-3 rounded-xl border-2 border-dashed border-red-500/30 bg-red-950/20 min-w-[120px] max-w-[200px] cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-red-500/30 !border-surface"
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="w-4 h-4 shrink-0 text-red-400 flex items-center justify-center text-xs font-bold">
          ?
        </span>
        <span className="text-sm font-semibold truncate text-red-300/80">{d.name}</span>
      </div>

      <p className="text-[10px] text-red-400/60 leading-relaxed">Required — not yet in graph</p>

      <div className="flex items-center gap-1.5 mt-2">
        <span className="w-1 h-1 rounded-full bg-red-500/40" />
        <span className="text-[10px] text-red-400/50 capitalize">{d.level}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-red-500/30 !border-surface"
      />
    </motion.div>
  );
}

export const MissingSkillGhost = memo(MissingSkillGhostComponent);
