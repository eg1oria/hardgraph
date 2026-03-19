import { create } from 'zustand';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';

/* ── Lazy xyflow bridge ──────────────────── */
// Runtime helpers are injected by HardGraph when xyflow loads.
// This avoids pulling the full @xyflow/react bundle into every page
// that reads graph state (toolbar, sidebar, dashboard, etc.).
let _applyNodeChanges: ((changes: NodeChange[], nodes: Node[]) => Node[]) | null = null;
let _applyEdgeChanges: ((changes: EdgeChange[], edges: Edge[]) => Edge[]) | null = null;

export function injectXyflowHelpers(
  applyNC: (changes: NodeChange[], nodes: Node[]) => Node[],
  applyEC: (changes: EdgeChange[], edges: Edge[]) => Edge[],
) {
  _applyNodeChanges = applyNC;
  _applyEdgeChanges = applyEC;
}

/* ── Domain types ────────────────────────── */

export interface GraphNode {
  id: string;
  name: string;
  description?: string;
  level: string;
  nodeType?: string;
  icon?: string;
  positionX: number;
  positionY: number;
  categoryId?: string;
  parentIdeaId?: string | null;
  isUnlocked: boolean;
  customData?: Record<string, unknown>;
  endorsementCount?: number;
}

export interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  edgeType: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  sortOrder: number;
}

/* ── React Flow node data ────────────────── */

export interface SkillNodeData extends Record<string, unknown> {
  name: string;
  description?: string;
  level: string;
  icon?: string;
  categoryId?: string;
  isUnlocked: boolean;
  categoryColor?: string;
  endorsementCount?: number;
  pitchStatus?: 'matched' | 'upgrade' | 'bonus' | 'missing' | null;
}

export interface PitchData {
  vacancyId: string;
  vacancyTitle: string;
  company: string | null;
  matchScore: number;
  matchedCount: number;
  upgradeCount: number;
  missingCount: number;
  totalRequired: number;
  nodeMatchMap: Record<string, 'matched' | 'upgrade' | 'bonus' | null>;
  missingSkills: Array<{
    name: string;
    requiredLevel: string;
    category?: string;
    categoryColor?: string;
  }>;
  categoryBreakdown: Array<{
    name: string;
    color: string;
    matchScore: number;
    matched: number;
    total: number;
  }>;
}

/* ── Converters: domain ↔ React Flow ─────── */

export function toRFNodes(nodes: GraphNode[], categories: Category[]): Node<SkillNodeData>[] {
  const catMap = new Map(categories.map((c) => [c.id, c.color ?? '#6366F1']));
  return nodes.map((n) => {
    const isRepo = n.nodeType === 'repository';
    const cd = (n.customData ?? {}) as Record<string, unknown>;
    return {
      id: n.id,
      type: isRepo ? 'repository' : 'skill',
      position: { x: n.positionX, y: n.positionY },
      data: {
        name: n.name,
        description: n.description,
        level: n.level,
        icon: n.icon,
        categoryId: n.categoryId,
        isUnlocked: n.isUnlocked,
        categoryColor: n.categoryId ? catMap.get(n.categoryId) : undefined,
        endorsementCount: n.endorsementCount ?? 0,
        ...(isRepo
          ? {
              nodeType: 'repository' as const,
              repoUrl: cd.repoUrl as string | undefined,
              language: cd.language as string | undefined,
              stars: cd.stars as number | undefined,
              forks: cd.forks as number | undefined,
            }
          : {}),
      },
    };
  });
}

export function toRFEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    type: e.edgeType === 'evolution' ? 'evolution' : 'skill',
    label: e.label,
    data: { edgeType: e.edgeType },
  }));
}

/* ── Store ───────────────────────────────── */

interface GraphState {
  graphId: string | null;
  title: string;
  slug: string;
  isPublic: boolean;
  updatedAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories: Category[];
  isDirty: boolean;

  // React Flow state
  rfNodes: Node<SkillNodeData>[];
  rfEdges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  setGraph: (data: {
    id: string;
    title: string;
    slug?: string;
    isPublic?: boolean;
    updatedAt?: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    categories: Category[];
  }) => void;

  // React Flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;

  // Domain CRUD
  addNode: (node: GraphNode) => void;
  updateNode: (id: string, data: Partial<GraphNode>) => void;
  removeNode: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  batchUpdatePositions: (updates: Array<{ id: string; x: number; y: number }>) => void;

  addEdge: (edge: GraphEdge) => void;
  removeEdge: (id: string) => void;

  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  removeCategory: (id: string) => void;

  // Pending connection (for async edge creation)
  pendingConnection: Connection | null;
  setPendingConnection: (c: Connection | null) => void;

  // Pending edge deletion (for async edge deletion from edge component)
  pendingDeleteEdgeId: string | null;
  requestDeleteEdge: (id: string) => void;

  // Pitch mode
  pitchMode: boolean;
  pitchData: PitchData | null;
  setPitchMode: (enabled: boolean, data?: PitchData) => void;

  setIsPublic: (isPublic: boolean) => void;
  setDirty: (dirty: boolean) => void;
  touchUpdatedAt: () => void;
  reset: () => void;
}

function rebuildRFNodes(nodes: GraphNode[], categories: Category[]) {
  return { rfNodes: toRFNodes(nodes, categories) };
}

function rebuildRFEdges(edges: GraphEdge[]) {
  return { rfEdges: toRFEdges(edges) };
}

function rebuildRF(state: { nodes: GraphNode[]; edges: GraphEdge[]; categories: Category[] }) {
  return {
    rfNodes: toRFNodes(state.nodes, state.categories),
    rfEdges: toRFEdges(state.edges),
  };
}

export const useGraphStore = create<GraphState>((set, _get) => ({
  graphId: null,
  title: '',
  slug: '',
  isPublic: false,
  updatedAt: '',
  nodes: [],
  edges: [],
  categories: [],
  isDirty: false,
  rfNodes: [],
  rfEdges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  pendingConnection: null,
  pendingDeleteEdgeId: null,
  pitchMode: false,
  pitchData: null,

  setGraph: (data) => {
    const nodes = data.nodes;
    const edges = data.edges;
    const categories = data.categories;
    set({
      graphId: data.id,
      title: data.title,
      slug: data.slug ?? '',
      isPublic: data.isPublic ?? false,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      nodes,
      edges,
      categories,
      isDirty: false,
      selectedNodeId: null,
      selectedEdgeId: null,
      pitchMode: false,
      pitchData: null,
      ...rebuildRF({ nodes, edges, categories }),
    });
  },

  onNodesChange: (changes) =>
    set((state) => {
      if (!_applyNodeChanges) return state;
      const rfNodes = _applyNodeChanges(changes, state.rfNodes) as Node<SkillNodeData>[];
      // Sync positions back to domain nodes
      const posChanges = changes.filter(
        (
          c,
        ): c is NodeChange & {
          type: 'position';
          id: string;
          position?: { x: number; y: number };
        } => c.type === 'position' && 'position' in c && c.position != null,
      );
      let nodes = state.nodes;
      if (posChanges.length > 0) {
        nodes = nodes.map((n) => {
          const pc = posChanges.find((c) => c.id === n.id);
          return pc && pc.position
            ? { ...n, positionX: pc.position.x, positionY: pc.position.y }
            : n;
        });
      }
      const hasDrag = posChanges.length > 0;
      return { rfNodes, nodes, isDirty: state.isDirty || hasDrag };
    }),

  onEdgesChange: (changes) =>
    set((state) => {
      if (!_applyEdgeChanges) return state;
      return { rfEdges: _applyEdgeChanges(changes, state.rfEdges) };
    }),

  onConnect: (connection) => {
    // Store pending connection — actual edge is created via API hook
    set({ pendingConnection: connection });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

  addNode: (node) =>
    set((state) => {
      const nodes = [...state.nodes, node];
      return {
        nodes,
        isDirty: true,
        ...rebuildRFNodes(nodes, state.categories),
      };
    }),

  updateNode: (id, data) =>
    set((state) => {
      const nodes = state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n));
      // Only rebuild RF nodes when visual-affecting fields change (skip for description-only edits)
      const visualKeys: Array<keyof GraphNode> = [
        'name',
        'level',
        'icon',
        'nodeType',
        'categoryId',
        'positionX',
        'positionY',
        'isUnlocked',
        'customData',
        'endorsementCount',
      ];
      const needsRebuild = Object.keys(data).some((k) => visualKeys.includes(k as keyof GraphNode));
      return {
        nodes,
        isDirty: true,
        ...(needsRebuild ? rebuildRFNodes(nodes, state.categories) : {}),
      };
    }),

  removeNode: (id) =>
    set((state) => {
      const nodes = state.nodes.filter((n) => n.id !== id);
      const edges = state.edges.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id);
      return {
        nodes,
        edges,
        isDirty: true,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        ...rebuildRF({ nodes, edges, categories: state.categories }),
      };
    }),

  updateNodePosition: (id, x, y) =>
    set((state) => {
      const nodes = state.nodes.map((n) =>
        n.id === id ? { ...n, positionX: x, positionY: y } : n,
      );
      return {
        nodes,
        isDirty: true,
        ...rebuildRFNodes(nodes, state.categories),
      };
    }),

  batchUpdatePositions: (updates) =>
    set((state) => {
      const posMap = new Map(updates.map((u) => [u.id, u]));
      const nodes = state.nodes.map((n) => {
        const u = posMap.get(n.id);
        return u ? { ...n, positionX: u.x, positionY: u.y } : n;
      });
      return {
        nodes,
        isDirty: true,
        ...rebuildRFNodes(nodes, state.categories),
      };
    }),

  addEdge: (edge) =>
    set((state) => {
      const edges = [...state.edges, edge];
      return {
        edges,
        isDirty: true,
        ...rebuildRFEdges(edges),
      };
    }),

  removeEdge: (id) =>
    set((state) => {
      const edges = state.edges.filter((e) => e.id !== id);
      return {
        edges,
        isDirty: true,
        selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
        ...rebuildRFEdges(edges),
      };
    }),

  addCategory: (category) =>
    set((state) => {
      const categories = [...state.categories, category];
      return {
        categories,
        isDirty: true,
        ...rebuildRFNodes(state.nodes, categories),
      };
    }),

  updateCategory: (id, data) =>
    set((state) => {
      const categories = state.categories.map((c) => (c.id === id ? { ...c, ...data } : c));
      // Only rebuild RF nodes if any node uses this category
      const hasAffected = state.nodes.some((n) => n.categoryId === id);
      return {
        categories,
        isDirty: true,
        ...(hasAffected ? rebuildRFNodes(state.nodes, categories) : {}),
      };
    }),

  removeCategory: (id) =>
    set((state) => {
      const categories = state.categories.filter((c) => c.id !== id);
      return {
        categories,
        isDirty: true,
        ...rebuildRFNodes(state.nodes, categories),
      };
    }),

  setPendingConnection: (c) => set({ pendingConnection: c }),
  requestDeleteEdge: (id) => set({ pendingDeleteEdgeId: id }),

  setPitchMode: (enabled, data) =>
    set((state) => {
      if (!enabled) {
        return {
          pitchMode: false,
          pitchData: null,
          ...rebuildRFNodes(state.nodes, state.categories),
        };
      }
      const pitchData = data ?? null;
      const nodeMatchMap = pitchData?.nodeMatchMap ?? {};
      const catMap = new Map(state.categories.map((c) => [c.id, c.color ?? '#6366F1']));

      // Rebuild RF nodes with pitchStatus injected
      const rfNodes: Node<SkillNodeData>[] = state.nodes.map((n) => {
        const isRepo = n.nodeType === 'repository';
        const cd = (n.customData ?? {}) as Record<string, unknown>;
        return {
          id: n.id,
          type: isRepo ? 'repository' : 'skill',
          position: { x: n.positionX, y: n.positionY },
          data: {
            name: n.name,
            description: n.description,
            level: n.level,
            icon: n.icon,
            categoryId: n.categoryId,
            isUnlocked: n.isUnlocked,
            categoryColor: n.categoryId ? catMap.get(n.categoryId) : undefined,
            endorsementCount: n.endorsementCount ?? 0,
            pitchStatus: nodeMatchMap[n.id] ?? null,
            ...(isRepo
              ? {
                  nodeType: 'repository' as const,
                  repoUrl: cd.repoUrl as string | undefined,
                  language: cd.language as string | undefined,
                  stars: cd.stars as number | undefined,
                  forks: cd.forks as number | undefined,
                }
              : {}),
          },
        };
      });

      // Inject ghost nodes for missing skills
      if (pitchData) {
        const graphNodes = state.nodes;
        // Calculate bottom boundary of existing nodes
        const maxY = graphNodes.length > 0 ? Math.max(...graphNodes.map((n) => n.positionY)) : 0;
        const ghostStartY = maxY + 200;
        const ghostSpacing = 180;
        const ghostsPerRow = 4;

        pitchData.missingSkills.forEach((skill, i) => {
          const col = i % ghostsPerRow;
          const row = Math.floor(i / ghostsPerRow);
          const centerX = ((ghostsPerRow - 1) * ghostSpacing) / 2;
          rfNodes.push({
            id: `ghost-${i}`,
            type: 'skill',
            position: {
              x: col * ghostSpacing - centerX,
              y: ghostStartY + row * 140,
            },
            data: {
              name: skill.name,
              description: `Required — not yet in graph`,
              level: skill.requiredLevel,
              icon: undefined,
              categoryId: undefined,
              isUnlocked: false,
              categoryColor: skill.categoryColor,
              endorsementCount: 0,
              pitchStatus: 'missing',
            },
          });
        });
      }

      return {
        pitchMode: true,
        pitchData,
        rfNodes,
      };
    }),

  setIsPublic: (isPublic) => set({ isPublic }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  touchUpdatedAt: () => set({ updatedAt: new Date().toISOString() }),

  reset: () =>
    set({
      graphId: null,
      title: '',
      slug: '',
      isPublic: false,
      updatedAt: '',
      nodes: [],
      edges: [],
      categories: [],
      isDirty: false,
      rfNodes: [],
      rfEdges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      pendingConnection: null,
      pendingDeleteEdgeId: null,
      pitchMode: false,
      pitchData: null,
    }),
}));
