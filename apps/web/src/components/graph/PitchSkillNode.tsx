'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChevronsUp, ThumbsUp, Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SkillNodeData } from '@/stores/useGraphStore';
import { NODE_COLORS } from '@/lib/constants';
import type { SkillLevel } from '@/lib/constants';
import { useGraphStore } from '@/stores/useGraphStore';

/** Stable hash-based delay so animation doesn't retrigger on re-render */
function stableDelay(nodeId: string): number {
  let h = 0;
  for (let i = 0; i < nodeId.length; i++) {
    h = (h * 31 + nodeId.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 300) / 1000; // 0–0.3s
}

function PitchSkillNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as SkillNodeData;
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const borderColor = d.categoryColor ?? NODE_COLORS[d.level as SkillLevel] ?? '#6366F1';
  const pitchStatus = d.pitchStatus;

  // Style overrides based on pitch status
  const statusStyles = getStatusStyles(pitchStatus, borderColor, selected ?? false);

  return (
    <motion.div
      initial={{ opacity: 0.3, scale: 0.95 }}
      animate={{
        opacity: statusStyles.opacity,
        scale: statusStyles.scale,
        filter: statusStyles.filter,
      }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: stableDelay(id) }}
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
      className={`group relative px-4 py-3 rounded-xl border-2 bg-surface min-w-[120px] max-w-[200px] transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${statusStyles.className} ${
        selected ? 'shadow-lg shadow-primary/20 scale-105' : ''
      }`}
      style={{
        borderColor: statusStyles.borderColor,
        borderStyle: statusStyles.borderStyle,
        boxShadow: statusStyles.boxShadow,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-border !border-surface"
      />

      <div className="flex items-center gap-2 mb-1">
        {pitchStatus === 'matched' && (
          <Check className="w-4 h-4 shrink-0 text-emerald-400" strokeWidth={2.5} />
        )}
        {pitchStatus === 'upgrade' && (
          <Zap className="w-4 h-4 shrink-0 text-amber-400" strokeWidth={2} />
        )}
        {pitchStatus !== 'matched' && pitchStatus !== 'upgrade' && (
          <ChevronsUp className="w-4 h-4 shrink-0" style={{ color: borderColor }} strokeWidth={1} />
        )}
        <span className="text-sm font-semibold truncate">{d.name}</span>
      </div>

      {pitchStatus === 'missing' && (
        <p className="text-[10px] text-red-400/80 leading-relaxed mb-1">
          Required — not yet in graph
        </p>
      )}

      {d.description && pitchStatus !== 'missing' && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {d.description}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-2">
        <span
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: NODE_COLORS[d.level as SkillLevel] ?? '#6366F1' }}
        />
        <span className="text-[10px] text-muted capitalize">{d.level}</span>
        {pitchStatus === 'matched' && (
          <span className="ml-auto text-[10px] text-emerald-400/80 font-medium">Match ✓</span>
        )}
        {pitchStatus === 'upgrade' && (
          <span className="ml-auto text-[10px] text-amber-400/80 font-medium">Partial ⚡</span>
        )}
        {(d.endorsementCount ?? 0) > 0 && !pitchStatus && (
          <span className="ml-auto flex items-center gap-0.5 text-[10px] text-emerald-400/70 tabular-nums">
            <ThumbsUp className="w-2.5 h-2.5" />
            {d.endorsementCount}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-border !border-surface"
      />
    </motion.div>
  );
}

function getStatusStyles(
  pitchStatus: string | null | undefined,
  borderColor: string,
  selected: boolean,
) {
  switch (pitchStatus) {
    case 'matched':
      return {
        opacity: 1,
        scale: 1.05,
        filter: 'none',
        borderColor: 'rgb(16 185 129 / 0.6)',
        borderStyle: 'solid' as const,
        boxShadow: '0 0 20px rgba(16, 185, 129, 0.2), 0 0 40px rgba(16, 185, 129, 0.1)',
        className: '',
      };
    case 'upgrade':
      return {
        opacity: 0.85,
        scale: 1,
        filter: 'none',
        borderColor: 'rgb(245 158 11 / 0.5)',
        borderStyle: 'solid' as const,
        boxShadow: '0 0 16px rgba(245, 158, 11, 0.2)',
        className: '',
      };
    case 'bonus':
      return {
        opacity: 0.25,
        scale: 1,
        filter: 'blur(1px)',
        borderColor: selected ? borderColor : `${borderColor}66`,
        borderStyle: 'solid' as const,
        boxShadow: 'none',
        className: '',
      };
    case 'missing':
      return {
        opacity: 0.6,
        scale: 1,
        filter: 'none',
        borderColor: 'rgb(239 68 68 / 0.3)',
        borderStyle: 'dashed' as const,
        boxShadow: 'none',
        className: '',
      };
    default:
      return {
        opacity: 1,
        scale: 1,
        filter: 'none',
        borderColor: selected ? borderColor : `${borderColor}66`,
        borderStyle: 'solid' as const,
        boxShadow: selected ? `0 0 16px ${borderColor}33` : 'none',
        className: 'hover:shadow-md hover:shadow-primary/10',
      };
  }
}

export const PitchSkillNode = memo(PitchSkillNodeComponent);
