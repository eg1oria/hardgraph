'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  addEdge,
  applyNodeChanges,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
  type NodeChange,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SkillNode } from '@/components/graph/SkillNode';
import { RepoNode } from '@/components/graph/RepoNode';
import { SkillEdge } from '@/components/graph/SkillEdge';
import { EvolutionEdge } from '@/components/graph/EvolutionEdge';
import { toRFNodes, toRFEdges, type GraphNode, type GraphEdge } from '@/stores/useGraphStore';

/* ── Feature metadata ── */
const features = [
  {
    number: '01',
    tag: 'Authentication',
    title: 'Sign in with GitHub',
    description:
      'Zero forms. Zero passwords. One click and your GitHub identity becomes your profile — repositories, contributions, and all.',
    accent: '#6366f1',
    accentRgb: '99,102,241',
  },
  {
    number: '02',
    tag: 'Import',
    title: 'Pull repos as nodes',
    description:
      'Browse your GitHub repositories and drop them straight onto the map. Your actual work — not made-up skills.',
    accent: '#22d3ee',
    accentRgb: '34,211,238',
  },
  {
    number: '03',
    tag: 'Visualization',
    title: 'See it on the map',
    description:
      "An interactive graph that shows exactly where you've been and where you're headed. Nodes, edges, depth — all yours.",
    accent: '#a855f7',
    accentRgb: '168,85,247',
  },
  {
    number: '04',
    tag: 'Discovery',
    title: 'Scan any GitHub profile',
    description:
      'Type any username and instantly see their skill tree — languages, frameworks, categories, all extracted from real repos. No signup needed.',
    accent: '#fb923c',
    accentRgb: '251,146,60',
  },
];

/* ================================================================
   MOCK UI PANELS — theme-aware (light + dark)
   ================================================================ */

/** Mock 1 — Login page with GitHub button */
function MockLogin() {
  return (
    <div className="p-6 flex flex-col items-center gap-5 pointer-events-none select-none">
      <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
        HardGraph
      </span>
      <div className="text-center">
        <h3 className="text-base font-bold text-foreground mb-1">Welcome back</h3>
        <p className="text-[11px] text-muted-foreground">
          Sign in to continue to your skill graphs
        </p>
      </div>
      <div className="w-full space-y-3">
        <div>
          <span className="block text-[10px] text-muted-foreground mb-1">Email</span>
          <div className="h-8 rounded-lg bg-secondary border border-border px-3 flex items-center text-[11px] text-muted">
            you@example.com
          </div>
        </div>
        <div>
          <span className="block text-[10px] text-muted-foreground mb-1">Password</span>
          <div className="h-8 rounded-lg bg-secondary border border-border px-3 flex items-center text-[11px] text-muted">
            ••••••••
          </div>
        </div>
        <div className="h-9 rounded-lg bg-primary flex items-center justify-center text-[11px] font-medium text-white">
          Sign in
        </div>
      </div>
      {/* Divider */}
      <div className="flex items-center w-full gap-3">
        <span className="flex-1 h-px bg-border" />
        <span className="text-[9px] uppercase text-muted-foreground tracking-wider">or</span>
        <span className="flex-1 h-px bg-border" />
      </div>
      {/* GitHub button */}
      <div className="w-full h-10 rounded-lg bg-[#24292f] dark:bg-[#1c2128] border border-border flex items-center justify-center gap-2 text-[12px] font-medium text-white shadow-sm ring-1 ring-indigo-500/20">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        Continue with GitHub
      </div>
      <p className="text-[10px] text-muted-foreground">
        Don&apos;t have an account? <span className="text-primary">Sign up</span>
      </p>
    </div>
  );
}

/** Mock 2 — Import from GitHub modal */
function MockImportGithub() {
  const repos = [
    {
      name: 'skill-graph-api',
      desc: 'REST API for skill graph platform',
      lang: 'TypeScript',
      stars: 48,
      selected: true,
    },
    {
      name: 'react-flow-hooks',
      desc: 'Custom hooks for React Flow',
      lang: 'TypeScript',
      stars: 124,
      selected: true,
    },
    {
      name: 'ml-experiments',
      desc: 'Machine learning playground',
      lang: 'Python',
      stars: 12,
      selected: false,
    },
    {
      name: 'portfolio-site',
      desc: 'Personal portfolio website',
      lang: 'JavaScript',
      stars: 7,
      selected: false,
    },
  ];
  const langColors: Record<string, string> = {
    TypeScript: '#3178c6',
    Python: '#3572a5',
    JavaScript: '#f1e05a',
  };
  return (
    <div className="p-5 space-y-4 pointer-events-none select-none">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        <span className="text-sm font-semibold text-foreground">Import from GitHub</span>
      </div>
      {/* Search */}
      <div className="h-8 rounded-lg bg-secondary border border-border px-3 flex items-center text-[11px] text-muted">
        Search repositories…
      </div>
      {/* Repo list */}
      <div className="space-y-1.5 max-h-[200px] overflow-hidden">
        {repos.map((r) => (
          <div
            key={r.name}
            className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
              r.selected
                ? 'bg-cyan-500/10 border border-cyan-500/30'
                : 'bg-secondary/60 border border-transparent'
            }`}
          >
            <div
              className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                r.selected ? 'bg-cyan-500 border-cyan-500' : 'border-border'
              }`}
            >
              {r.selected && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground truncate">{r.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{r.desc}</p>
              <div className="flex items-center gap-2.5 mt-1 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: langColors[r.lang] ?? '#888' }}
                  />
                  {r.lang}
                </span>
                <span className="flex items-center gap-0.5">★ {r.stars}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground">2 selected</span>
        <div className="flex gap-2">
          <span className="text-[10px] text-muted-foreground px-3 py-1.5 rounded-lg border border-border bg-secondary">
            Cancel
          </span>
          <span className="text-[10px] text-white font-medium px-3 py-1.5 rounded-lg bg-cyan-500">
            Import 2 repos
          </span>
        </div>
      </div>
    </div>
  );
}

const DEMO_NODES: GraphNode[] = [
  {
    id: 'd-react',
    name: 'React',
    description: 'UI framework',
    level: 'advanced',
    nodeType: 'skill',
    positionX: 200,
    positionY: 0,
    isUnlocked: true,
  },
  {
    id: 'd-next',
    name: 'Next.js',
    description: 'Full-stack framework',
    level: 'intermediate',
    nodeType: 'skill',
    positionX: 380,
    positionY: 140,
    isUnlocked: true,
  },
  {
    id: 'd-ts',
    name: 'TypeScript',
    description: 'Type-safe JS',
    level: 'advanced',
    nodeType: 'skill',
    positionX: 200,
    positionY: 280,
    isUnlocked: true,
  },
  {
    id: 'd-repo',
    name: 'hardgraph-api',
    description: 'REST API for skill graphs',
    level: 'intermediate',
    nodeType: 'repository',
    positionX: 20,
    positionY: 140,
    isUnlocked: true,
    customData: {
      repoUrl: '#',
      language: 'TypeScript',
      stars: 48,
      forks: 5,
      fullName: 'user/hardgraph-api',
    },
  },
  {
    id: 'd-node',
    name: 'Node.js',
    description: 'Connect me! →',
    level: 'beginner',
    nodeType: 'skill',
    positionX: 420,
    positionY: 300,
    isUnlocked: true,
  },
];

const DEMO_EDGES: GraphEdge[] = [
  { id: 'de-1', sourceNodeId: 'd-react', targetNodeId: 'd-next', edgeType: 'skill' },
  { id: 'de-2', sourceNodeId: 'd-react', targetNodeId: 'd-repo', edgeType: 'skill' },
  { id: 'de-3', sourceNodeId: 'd-next', targetNodeId: 'd-ts', edgeType: 'skill' },
  { id: 'de-4', sourceNodeId: 'd-repo', targetNodeId: 'd-ts', edgeType: 'skill' },
];

const demoNodeTypes: NodeTypes = { skill: SkillNode, repository: RepoNode };
const demoEdgeTypes: EdgeTypes = { skill: SkillEdge, evolution: EvolutionEdge };
const demoDefaultEdgeOptions = { type: 'skill' as const, animated: false };

function MockNodeGraph() {
  const [nodes, setNodes] = useState<Node[]>(() => toRFNodes(DEMO_NODES, []));
  const [edges, setEdges] = useState<Edge[]>(() => toRFEdges(DEMO_EDGES));

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onConnect = useCallback(
    (conn: Connection) => setEdges((eds) => addEdge({ ...conn, type: 'skill' }, eds)),
    [],
  );

  return (
    <div className="h-[340px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        nodeTypes={demoNodeTypes}
        edgeTypes={demoEdgeTypes}
        defaultEdgeOptions={demoDefaultEdgeOptions}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.35 }}
        proOptions={{ hideAttribution: true }}
        /*
         * ReactFlow не читает Tailwind-классы для своего фона напрямую,
         * поэтому используем CSS-переменную из globals.css через inline style.
         * В тёмной теме .dark выставляет --background: 240 33% 5%,
         * в светлой — 220 16% 96%.
         */
        style={{ background: 'hsl(var(--background))' }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        {/*
         * Background dot/line color тоже адаптируем:
         * в светлой теме — тёмные точки, в тёмной — светлые.
         * Используем currentColor через CSS-переменную border.
         */}
        <Background gap={24} size={1} color="hsl(var(--border))" />
      </ReactFlow>
    </div>
  );
}

/** Mock 4 — GitHub Scan results panel */
function MockGitHubScan() {
  const categories = [
    { name: 'Frontend', color: '#00d4ff', score: 82 },
    { name: 'Backend', color: '#a855f7', score: 68 },
    { name: 'DevOps', color: '#f97316', score: 45 },
  ];
  const topSkills = [
    { name: 'TypeScript', level: 'expert' },
    { name: 'React', level: 'advanced' },
    { name: 'Next.js', level: 'advanced' },
    { name: 'Node.js', level: 'intermediate' },
    { name: 'Docker', level: 'beginner' },
  ];
  const levelColors: Record<string, string> = {
    expert: '#eab308',
    advanced: '#a855f7',
    intermediate: '#3b82f6',
    beginner: '#71717a',
  };
  return (
    <div className="p-5 space-y-4 pointer-events-none select-none">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-8 rounded-lg bg-secondary border border-border px-3 flex items-center text-[11px] text-foreground">
          <svg className="w-3 h-3 text-muted-foreground mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          torvalds
        </div>
        <div className="h-8 px-3 rounded-lg bg-orange-500 flex items-center text-[10px] font-medium text-white shrink-0">
          Scan
        </div>
      </div>
      {/* Profile mini */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
          LT
        </div>
        <div>
          <p className="text-[11px] font-semibold text-foreground">torvalds</p>
          <p className="text-[9px] text-muted-foreground">42 repos · 8 languages · 14 skills</p>
        </div>
      </div>
      {/* Top skills row */}
      <div>
        <span className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Top Skills
        </span>
        <div className="flex flex-wrap gap-1">
          {topSkills.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium"
              style={{
                borderColor: `${levelColors[s.level]}66`,
                color: levelColors[s.level],
                background: `${levelColors[s.level]}15`,
              }}
            >
              {s.name}
            </span>
          ))}
        </div>
      </div>
      {/* Category bars */}
      <div className="space-y-2">
        <span className="block text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
          Categories
        </span>
        {categories.map((c) => (
          <div key={c.name} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span className="text-[10px] font-medium text-foreground">{c.name}</span>
              </div>
              <span className="text-[10px] font-bold" style={{ color: c.color }}>{c.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: c.color }} />
            </div>
          </div>
        ))}
      </div>
      {/* CTA */}
      <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5 text-center">
        <p className="text-[10px] text-foreground font-medium mb-1.5">Want the full picture?</p>
        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-white px-3 py-1 rounded-lg bg-orange-500">
          Create free account
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Mapping index → mock component ── */
const mockPanels: Record<number, React.FC> = {
  0: MockLogin,
  1: MockImportGithub,
  2: MockNodeGraph,
  3: MockGitHubScan,
};

/* ── Feature row (text + mock) ── */
function FeatureRow({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isEven = index % 2 === 0;
  const MockPanel = mockPanels[index] ?? (() => null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={rowRef}
      className="grid md:grid-cols-2 gap-10 md:gap-20 items-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translateY(32px)`,
        transition: `opacity 0.65s ease ${index * 0.08}s, transform 0.65s ease ${index * 0.08}s`,
      }}
    >
      {/* ── Text block ── */}
      <div className={isEven ? '' : 'md:order-2'}>
        {/* Badge row */}
        <div className="flex items-center gap-3 mb-5">
          <span
            className="text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded-md"
            style={{
              color: feature.accent,
              background: `rgba(${feature.accentRgb},0.1)`,
              border: `1px solid rgba(${feature.accentRgb},0.2)`,
            }}
          >
            {feature.tag}
          </span>
          <span
            className="text-[11px] font-mono"
            style={{ color: `rgba(${feature.accentRgb},0.5)` }}
          >
            {feature.number}
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold leading-snug mb-4 text-foreground">
          {feature.title}
        </h3>

        <p className="text-muted-foreground leading-relaxed text-[15px]">{feature.description}</p>

        {/* Decorative accent line */}
        <div
          className="mt-7 h-px w-16 rounded-full"
          style={{ background: `rgba(${feature.accentRgb},0.35)` }}
        />
      </div>

      {/* ── Mock UI block ── */}
      <div className={`relative ${isEven ? 'md:order-2' : 'md:order-1'}`}>
        {/* Soft glow behind */}
        <div
          className="absolute -inset-6 rounded-3xl opacity-[0.12] blur-2xl pointer-events-none"
          style={{ background: feature.accent }}
        />

        {/* Card */}
        <div
          className="relative rounded-2xl overflow-hidden bg-surface"
          style={{
            border: `1px solid rgba(${feature.accentRgb},0.18)`,
            boxShadow: `0 20px 60px -16px rgba(${feature.accentRgb},0.15)`,
          }}
        >
          {/* Fake browser chrome */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            <span
              className="ml-3 h-5 flex-1 rounded text-[10px] px-2 flex items-center text-muted-foreground"
              style={{
                background: `rgba(${feature.accentRgb},0.07)`,
              }}
            >
              hardgraph.com
            </span>
          </div>

          {/* Inline mock UI */}
          <MockPanel />
        </div>

        {/* Corner number — decorative */}
        <div
          className="absolute -bottom-3 -right-3 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black select-none pointer-events-none"
          style={{
            background: `rgba(${feature.accentRgb},0.08)`,
            border: `1px solid rgba(${feature.accentRgb},0.14)`,
            color: `rgba(${feature.accentRgb},0.25)`,
          }}
        >
          {feature.number}
        </div>
      </div>
    </div>
  );
}

export function SeeItYourself() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHeaderVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient orbs */}
      <div
        className="absolute top-1/4 -left-32 w-80 h-80 rounded-full blur-3xl opacity-[0.06] pointer-events-none"
        style={{ background: '#6366f1' }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.06] pointer-events-none"
        style={{ background: '#22d3ee' }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mb-20 sm:mb-28"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'none' : 'translateY(24px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground mb-5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#6366f1' }}
            />
            See it yourself
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5 text-foreground">
            Everything you need,{' '}
            <span
              style={{
                background: 'linear-gradient(120deg, #6366f1 0%, #22d3ee 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              nothing you don&apos;t
            </span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Four features, built to get out of your way and let your skills do the talking.
          </p>
        </div>

        {/* Feature rows */}
        <div className="flex flex-col gap-24 sm:gap-36">
          {features.map((feature, i) => (
            <FeatureRow key={feature.number} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
