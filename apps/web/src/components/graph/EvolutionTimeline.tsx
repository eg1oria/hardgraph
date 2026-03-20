'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import { api } from '@/lib/api';
import { useGraphStore } from '@/stores/useGraphStore';

interface EvolutionChainNode {
  id: string;
  name: string;
  description?: string;
  level: string;
  nodeType: string;
  icon?: string;
  parentIdeaId: string | null;
  createdAt: string;
}

interface EvolutionChainResult {
  rootId: string;
  currentNodeId: string;
  chain: EvolutionChainNode[];
}

export function EvolutionTimeline({ nodeId }: { nodeId: string }) {
  const [chain, setChain] = useState<EvolutionChainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const setSelectedNode = useGraphStore((s) => s.setSelectedNode);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const res = await api.get<EvolutionChainResult>(
          `/nodes/${nodeId}/evolution-chain`,
          controller.signal,
        );
        if (!controller.signal.aborted) setChain(res);
      } catch {
        if (!controller.signal.aborted) setChain(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [nodeId]);

  const handleClick = useCallback(
    (id: string) => {
      setSelectedNode(id);
    },
    [setSelectedNode],
  );

  // Don't show if there's no evolution chain (single node with no parent/children)
  const { orderedChain, hasBranches, childrenMap } = useMemo(() => {
    if (!chain || chain.chain.length <= 1)
      return { orderedChain: [], hasBranches: false, childrenMap: new Map() };

    // Build a linear path from root to deepest descendant through current node
    const cMap = new Map<string | null, EvolutionChainNode[]>();
    for (const n of chain.chain) {
      const arr = cMap.get(n.parentIdeaId) ?? [];
      arr.push(n);
      cMap.set(n.parentIdeaId, arr);
    }

    const ordered: EvolutionChainNode[] = [];
    let cur: string | null = chain.rootId;
    const visited = new Set<string>();

    while (cur) {
      const node = chain.chain.find((n) => n.id === cur);
      if (!node || visited.has(node.id)) break;
      visited.add(node.id);
      ordered.push(node);
      const children: EvolutionChainNode[] = cMap.get(cur) ?? [];
      const nextChild =
        children.find((c) => c.id === nodeId) ??
        children.find((c) => {
          const desc = new Set<string>();
          const q = [c.id];
          while (q.length) {
            const id = q.shift()!;
            if (desc.has(id)) continue;
            desc.add(id);
            for (const ch of cMap.get(id) ?? []) q.push(ch.id);
          }
          return desc.has(nodeId);
        }) ??
        children[0];
      cur = nextChild?.id ?? null;
    }

    const branches = chain.chain.some(
      (n) => n.parentIdeaId && (cMap.get(n.parentIdeaId)?.length ?? 0) > 1,
    );

    return { orderedChain: ordered, hasBranches: branches, childrenMap: cMap };
  }, [chain, nodeId]);

  if (loading || orderedChain.length <= 1) return null;

  return (
    <div className="pt-2 border-t border-border">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <GitBranch className="w-3 h-3" />
        Evolution {hasBranches ? 'Tree' : 'Chain'}
      </label>
      <div className="space-y-0">
        {orderedChain.map((n, i) => {
          const isCurrent = n.id === nodeId;
          const siblings: EvolutionChainNode[] = n.parentIdeaId
            ? (childrenMap.get(n.parentIdeaId) ?? [])
            : [];
          const hasSiblings = siblings.length > 1;
          return (
            <div key={n.id}>
              <button
                onClick={() => handleClick(n.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left min-h-[32px] ${
                  isCurrent
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'hover:bg-surface-light text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-purple-400' : 'bg-border'}`}
                  />
                  <span className="text-[10px] text-muted">v{i + 1}</span>
                </div>
                <span className="truncate">{n.name}</span>
              </button>
              {hasSiblings && isCurrent && (
                <div className="ml-6 mt-0.5 mb-0.5">
                  {siblings
                    .filter((s) => s.id !== n.id)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleClick(s.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:bg-surface-light transition-colors w-full text-left"
                      >
                        <span className="text-muted">├</span>
                        <span className="truncate">{s.name}</span>
                      </button>
                    ))}
                </div>
              )}
              {i < orderedChain.length - 1 && (
                <div className="ml-[11px] h-3 border-l border-purple-500/30" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
