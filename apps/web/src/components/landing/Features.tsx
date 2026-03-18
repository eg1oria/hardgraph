'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap, Share2, Palette, LayoutGrid, Globe, Lock } from 'lucide-react';

const features = [
  {
    icon: LayoutGrid,
    title: 'Visual Skill Trees',
    description: 'Drag-and-drop editor with auto-layout and custom colors.',
  },
  {
    icon: Palette,
    title: 'Beautiful Themes',
    description: 'Cyberpunk, Neon, Ocean — or create your own look.',
  },
  {
    icon: Share2,
    title: 'Share Anywhere',
    description: 'Unique URL to embed in portfolios, resumes, and socials.',
  },
  {
    icon: Zap,
    title: 'Instant Templates',
    description: 'Start from 20+ templates for any profession — tech, design, business, and more.',
  },
  {
    icon: Globe,
    title: 'Community Explore',
    description: 'Discover skill trees from professionals around the world.',
  },
  {
    icon: Lock,
    title: 'Your Data, Your Control',
    description: 'Export as JSON or image. Choose what stays private.',
  },
];

function FeatureCard({ feature, i }: { feature: (typeof features)[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(16px)',
        transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`,
      }}
    >
      <div className="p-6 h-full">
        <div className="w-8 h-8 rounded-lg bg-primary/[0.08] flex items-center justify-center mb-4">
          <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-semibold mb-1.5 leading-snug">{feature.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 relative ">
      <div
        className="absolute bottom-1/4 -left-32 w-80 h-80 rounded-full blur-3xl opacity-[0.06] pointer-events-none"
        style={{ background: '#22d3ee' }}
      />
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 sm:mb-16">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3">Features</p>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight max-w-md">
            Everything you need to <span className="text-gradient">stand out</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/50">
          {features.map((feature, i) => (
            <div key={feature.title} className="bg-background">
              <FeatureCard feature={feature} i={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
