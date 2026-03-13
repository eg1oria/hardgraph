'use client';

import { useEffect, useRef, useState } from 'react';

const features = [
  {
    number: '01',
    tag: 'Authentication',
    title: 'Sign in with GitHub',
    description:
      'Zero forms. Zero passwords. One click and your GitHub identity becomes your profile — repositories, contributions, and all.',
    image: '/view/img1.webp',
    accent: '#6366f1',
    accentRgb: '99,102,241',
  },
  {
    number: '02',
    tag: 'Import',
    title: 'Pull repos as nodes',
    description:
      'Browse your GitHub repositories and drop them straight onto the map. Your actual work — not made-up skills.',
    image: '/view/img2.webp',
    accent: '#22d3ee',
    accentRgb: '34,211,238',
  },
  {
    number: '03',
    tag: 'Visualization',
    title: 'See it on the map',
    description:
      "An interactive graph that shows exactly where you've been and where you're headed. Nodes, edges, depth — all yours.",
    image: '/view/img3.webp',
    accent: '#a855f7',
    accentRgb: '168,85,247',
  },
  {
    number: '04',
    tag: 'Profile',
    title: 'Add your social links',
    description:
      'Twitter, LinkedIn, your personal site — pin them all to your profile. Your skill map becomes your living portfolio.',
    image: '/view/img4.webp',
    accent: '#fb923c',
    accentRgb: '251,146,60',
  },
];

function FeatureRow({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isEven = index % 2 === 0;

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

      {/* ── Screenshot block ── */}
      <div className={`relative ${isEven ? 'md:order-2' : 'md:order-1'}`}>
        {/* Soft glow behind */}
        <div
          className="absolute -inset-6 rounded-3xl opacity-[0.15] blur-2xl pointer-events-none"
          style={{ background: feature.accent }}
        />

        {/* Card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            border: `1px solid rgba(${feature.accentRgb},0.18)`,
            background: 'var(--surface, #111)',
            boxShadow: `0 20px 60px -16px rgba(${feature.accentRgb},0.18)`,
          }}
        >
          {/* Fake browser chrome */}
          <div
            className="flex items-center gap-1.5 px-4 py-2.5 border-b"
            style={{ borderColor: `rgba(${feature.accentRgb},0.12)` }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/40" />
            <span
              className="ml-3 h-5 flex-1 rounded text-[10px] px-2 flex items-center"
              style={{
                background: `rgba(${feature.accentRgb},0.07)`,
                color: `rgba(${feature.accentRgb},0.45)`,
              }}
            >
              skilltree.app
            </span>
          </div>

          {/* Screenshot */}
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src={feature.image}
              alt={feature.title}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
            {/* bottom fade */}
            <div
              className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
              style={{
                background: `linear-gradient(to top, var(--surface, #111) 0%, transparent 100%)`,
              }}
            />
          </div>
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
        className="absolute top-1/4 -left-32 w-80 h-80 rounded-full blur-3xl opacity-[0.04] pointer-events-none"
        style={{ background: '#6366f1' }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.04] pointer-events-none"
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
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
