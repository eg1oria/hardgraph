'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap, Share2, Palette, LayoutGrid, Globe, Lock } from 'lucide-react';

const features = [
  {
    icon: LayoutGrid,
    title: 'Visual Skill Trees',
    description:
      'Drag-and-drop node editor with auto-layout. Organize skills into categories with custom colors.',
    accent: '#6366f1',
    accentRgb: '99,102,241',
    index: '01',
  },
  {
    icon: Palette,
    title: 'Beautiful Themes',
    description:
      'Choose from curated themes like Cyberpunk, Neon, Ocean — or create your own custom look.',
    accent: '#a855f7',
    accentRgb: '168,85,247',
    index: '02',
  },
  {
    icon: Share2,
    title: 'Share Anywhere',
    description:
      'Public profile page with unique URL. Embed your skill tree in portfolios, resumes, and social media.',
    accent: '#22d3ee',
    accentRgb: '34,211,238',
    index: '03',
  },
  {
    icon: Zap,
    title: 'Instant Templates',
    description:
      'Start from templates for Frontend, Backend, DevOps, Design, and more. Customize to make it yours.',
    accent: '#fb923c',
    accentRgb: '251,146,60',
    index: '04',
  },
  {
    icon: Globe,
    title: 'Community Explore',
    description:
      'Discover what others are learning. Get inspired by skill trees from developers around the world.',
    accent: '#34d399',
    accentRgb: '52,211,153',
    index: '05',
  },
  {
    icon: Lock,
    title: 'Your Data, Your Control',
    description:
      "Export your graph data as JSON or image. Choose what's public and what stays private.",
    accent: '#f472b6',
    accentRgb: '244,114,182',
    index: '06',
  },
];

function FeatureCard({ feature, i }: { feature: (typeof features)[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Icon = feature.icon;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${i * 0.07}s, transform 0.55s ease ${i * 0.07}s`,
      }}
    >
      <div
        className="relative p-6 rounded-2xl h-full transition-all duration-300 cursor-default"
        style={{
          background: hovered ? `rgba(${feature.accentRgb}, 0.04)` : 'transparent',
          border: `1px solid ${hovered ? `rgba(${feature.accentRgb}, 0.25)` : 'rgba(var(--border-rgb, 214,220,227), 0.8)'}`,
          boxShadow: hovered
            ? `0 0 0 1px rgba(${feature.accentRgb}, 0.1), 0 8px 32px -8px rgba(${feature.accentRgb}, 0.15)`
            : 'none',
        }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{
              background: `rgba(${feature.accentRgb}, ${hovered ? 0.15 : 0.08})`,
            }}
          >
            <Icon
              className="w-4 h-4 transition-all duration-300"
              style={{ color: feature.accent, opacity: hovered ? 1 : 0.7 }}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-[15px] font-semibold mb-2 leading-snug transition-colors duration-300"
          style={{ color: hovered ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.85)' }}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p
          className="text-[13px] leading-relaxed"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {feature.description}
        </p>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-6 right-6 h-px rounded-full transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${feature.accentRgb}, ${hovered ? 0.4 : 0}), transparent)`,
          }}
        />
      </div>
    </div>
  );
}

export function Features() {
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
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-12 sm:mb-16"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.55s ease, transform 0.55s ease',
          }}
        >
          {/* Label */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-6 rounded-full bg-primary/40" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground/60">
              Features
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-bold leading-tight max-w-lg">
              Everything you need to{' '}
              <span
                style={{
                  background: 'linear-gradient(120deg, #6366f1, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                stand out
              </span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed sm:text-right">
              A complete toolkit for creating and sharing interactive skill visualizations.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
