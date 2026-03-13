'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Github, Star, GitFork } from 'lucide-react';
import { useGraphStore } from '@/stores/useGraphStore';

function RepoNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);
  const name = d.name as string;
  const description = d.description as string | undefined;
  const language = d.language as string | undefined;
  const stars = (d.stars as number) ?? 0;
  const forks = (d.forks as number) ?? 0;

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
      aria-label={`Repository: ${name}`}
      className={`group relative px-4 py-3 rounded-xl border-2 bg-surface min-w-[120px] max-w-[220px] transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
        selected
          ? 'border-purple-400 shadow-lg shadow-purple-500/20 scale-105'
          : 'border-purple-500/40 hover:border-purple-400/60 hover:shadow-md hover:shadow-purple-500/10 active:scale-[0.97]'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-border !border-surface"
      />

      <div className="flex items-center gap-2 mb-1">
        <Github className="w-4 h-4 text-purple-400 shrink-0" />
        <span className="text-sm font-semibold truncate">{name}</span>
      </div>

      {description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
        {language && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            {language}
          </span>
        )}
        {stars > 0 && (
          <span className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5" /> {stars}
          </span>
        )}
        {forks > 0 && (
          <span className="flex items-center gap-0.5">
            <GitFork className="w-2.5 h-2.5" /> {forks}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-border !border-surface"
      />
    </div>
  );
}

export const RepoNode = memo(RepoNodeComponent);
