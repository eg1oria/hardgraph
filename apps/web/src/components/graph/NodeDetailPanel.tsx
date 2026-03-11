'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, X, ExternalLink } from 'lucide-react';
import { useGraphStore, type GraphNode } from '@/stores/useGraphStore';
import { SKILL_LEVELS, NODE_COLORS } from '@/lib/constants';
import { HashtagText } from '@/components/graph/HashtagText';
import { useHashtagNavigation } from '@/hooks/useHashtagNavigation';
import { hasHashtags } from '@/lib/hashtag-parser';

interface NodeDetailPanelProps {
  onUpdate: (id: string, data: Partial<GraphNode>) => void;
  onDelete: (id: string) => void;
}

export function NodeDetailPanel({ onUpdate, onDelete }: NodeDetailPanelProps) {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const categories = useGraphStore((s) => s.categories);
  const { handleTagClick } = useHashtagNavigation();

  const node = useMemo(() => nodes.find((n) => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('beginner');

  const [categoryId, setCategoryId] = useState('');

  // Sync form with selected node — on node switch or external data changes
  useEffect(() => {
    if (node) {
      setName(node.name);
      setDescription(node.description ?? '');
      setLevel(node.level);
      setCategoryId(node.categoryId ?? '');
    }
  }, [selectedNodeId, node?.name, node?.description, node?.level, node?.categoryId]);

  const handleBlurSave = useCallback(() => {
    if (!node) return;
    onUpdate(node.id, {
      name: name.trim() || node.name,
      description: description.trim() || '',
      level,
      categoryId: categoryId || undefined,
    });
  }, [node, name, description, level, categoryId, onUpdate]);

  if (!node) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Select a node to see its properties.</div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Node Properties</h3>
        <button
          onClick={() => useGraphStore.getState().setSelectedNode(null)}
          className="p-1.5 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors min-w-[30px] min-h-[30px]"
          aria-label="Close properties"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Name</label>
        <input
          className="input-field !text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlurSave}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Description</label>
        <textarea
          className="input-field !text-sm resize-none"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleBlurSave}
          placeholder="Use #hashtags to link nodes"
        />
        {description && hasHashtags(description) && (
          <div className="mt-1.5 p-2 rounded-lg bg-surface-light text-xs text-muted-foreground leading-relaxed">
            <HashtagText text={description} onTagClick={handleTagClick} />
          </div>
        )}
      </div>

      {/* Level */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1.5">Level</label>
        <div className="grid grid-cols-2 gap-1.5">
          {SKILL_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLevel(l);
                onUpdate(node.id, { level: l });
              }}
              className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                level === l
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-surface-light text-muted-foreground hover:border-primary/30'
              }`}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                style={{ backgroundColor: NODE_COLORS[l] }}
              />
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Category</label>
          <select
            className="input-field !text-sm"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              onUpdate(node.id, { categoryId: e.target.value || undefined });
            }}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Repository info */}
      {node.nodeType === 'repository' &&
        node.customData &&
        (() => {
          const cd = node.customData as Record<string, unknown>;
          const repoUrl = cd.repoUrl as string | undefined;
          const lang = cd.language as string | undefined;
          const stars = (cd.stars as number) ?? 0;
          const forks = (cd.forks as number) ?? 0;
          return (
            <div className="space-y-2">
              <label className="block text-xs text-muted-foreground">Repository</label>
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open on GitHub
                </a>
              )}
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {lang && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    {lang}
                  </span>
                )}
                {stars > 0 && <span>★ {stars}</span>}
                {forks > 0 && <span>⑂ {forks}</span>}
              </div>
            </div>
          );
        })()}

      {/* Delete */}
      <div className="pt-2 border-t border-border">
        <button
          onClick={() => onDelete(node.id)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Node
        </button>
      </div>
    </div>
  );
}
