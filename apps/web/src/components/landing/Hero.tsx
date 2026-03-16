'use client';

import Link from 'next/link';
import { useRef, useState, useCallback, useEffect } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [smoothMouse, setSmoothMouse] = useState<MousePosition>({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const mouseRef = useRef<MousePosition>({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchDevice) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseRef.current = { x, y };
    },
    [isTouchDevice],
  );

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const animate = () => {
      setSmoothMouse((prev) => ({
        x: lerp(prev.x, mouseRef.current.x, 0.08),
        y: lerp(prev.y, mouseRef.current.y, 0.08),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const t0 = { x: smoothMouse.x * -2, y: smoothMouse.y * -2 };
  const t1 = { x: smoothMouse.x * 5, y: smoothMouse.y * 3 };
  const t2 = { x: smoothMouse.x * 10, y: smoothMouse.y * 7 };
  const glowX = 480 + smoothMouse.x * 300;
  const glowY = 270 + smoothMouse.y * 200;

  return (
    <section className="relative pt-28 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
      <div
        className="absolute top-1/4 -left-32 w-80 h-80 rounded-full blur-3xl opacity-[0.06] pointer-events-none"
        style={{ background: '#63e8f1' }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.06] pointer-events-none"
        style={{ background: '#22ee7e' }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[400px] bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground/60 mb-6 animate-fade-in">
          Visual skill mapping
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5 animate-fade-in">
          Your skills deserve
          <br />
          <span className="text-gradient">a better map</span>
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto mb-10 animate-slide-up leading-relaxed">
          Create interactive skill trees. Visualize expertise, track growth, share your journey.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-primary hover:bg-primary-600 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98] text-center min-h-[48px] flex items-center justify-center"
          >
            Start building — free
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto px-7 py-3 rounded-xl border border-border hover:border-border-light text-muted-foreground hover:text-foreground text-sm font-medium transition-all active:scale-[0.98] text-center min-h-[48px] flex items-center justify-center"
          >
            Explore
          </Link>
        </div>

        {/* Graph preview */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="mt-16 sm:mt-24 relative left-1/2 -translate-x-1/2 w-[min(100vw-2rem,1080px)] animate-slide-up"
        >
          <div className="absolute -inset-4 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-surface/30 backdrop-blur-sm aspect-video relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 960 540"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="0.6" fill="currentColor" opacity="0.08" />
                </pattern>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="edge1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="edge2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              <rect width="960" height="540" fill="url(#dots)" className="text-foreground" />

              <ellipse cx={glowX} cy={glowY} rx="200" ry="160" fill="url(#glow)" />

              {/* Edges */}
              <g style={{ transform: `translate(${(t0.x + t1.x) / 2}px, ${(t0.y + t1.y) / 2}px)` }}>
                <path
                  d="M 240 270 C 320 270, 340 180, 420 180"
                  stroke="url(#edge1)"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.6"
                >
                  <animate
                    attributeName="opacity"
                    values="0.4;0.7;0.4"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2" fill="rgb(99,102,241)" opacity="0.5">
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path="M 240 270 C 320 270, 340 180, 420 180"
                  />
                </circle>
                <path
                  d="M 240 270 C 320 270, 340 360, 420 360"
                  stroke="url(#edge1)"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.5"
                >
                  <animate
                    attributeName="opacity"
                    values="0.3;0.6;0.3"
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2" fill="rgb(99,102,241)" opacity="0.4">
                  <animateMotion
                    dur="3.5s"
                    repeatCount="indefinite"
                    path="M 240 270 C 320 270, 340 360, 420 360"
                  />
                </circle>
              </g>

              <g style={{ transform: `translate(${(t1.x + t2.x) / 2}px, ${(t1.y + t2.y) / 2}px)` }}>
                <path
                  d="M 480 175 C 540 175, 560 135, 620 135"
                  stroke="url(#edge2)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.5"
                />
                <path
                  d="M 480 185 C 540 185, 560 225, 620 225"
                  stroke="url(#edge2)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.5"
                />
                <path
                  d="M 480 355 C 540 355, 560 315, 620 315"
                  stroke="url(#edge2)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.4"
                />
                <path
                  d="M 480 365 C 540 365, 560 405, 620 405"
                  stroke="url(#edge2)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.4"
                />
              </g>

              {/* Root node */}
              <g style={{ transform: `translate(${t0.x}px, ${t0.y}px)` }}>
                <rect
                  x="198"
                  y="239"
                  width="84"
                  height="62"
                  rx="14"
                  fill="rgb(99,102,241)"
                  fillOpacity="0.12"
                  stroke="rgb(99,102,241)"
                  strokeOpacity="0.55"
                  strokeWidth="1.8"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.3;0.6;0.3"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </rect>
                <text
                  x="240"
                  y="276"
                  textAnchor="middle"
                  fill="rgb(99,102,241)"
                  fontSize="13"
                  fontWeight="700"
                >
                  Core
                </text>
              </g>

              {/* Tier 1 */}
              <g style={{ transform: `translate(${t1.x}px, ${t1.y}px)` }}>
                <rect
                  x="411"
                  y="154"
                  width="78"
                  height="50"
                  rx="12"
                  fill="currentColor"
                  fillOpacity="0.06"
                  stroke="rgb(99,102,241)"
                  strokeOpacity="0.4"
                  strokeWidth="1.2"
                  className="text-foreground"
                />
                <text
                  x="450"
                  y="185"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="11"
                  fontWeight="600"
                  opacity="0.82"
                  className="text-foreground"
                >
                  React
                </text>
                <rect
                  x="411"
                  y="334"
                  width="78"
                  height="50"
                  rx="12"
                  fill="currentColor"
                  fillOpacity="0.06"
                  stroke="rgb(99,102,241)"
                  strokeOpacity="0.4"
                  strokeWidth="1.2"
                  className="text-foreground"
                />
                <text
                  x="450"
                  y="365"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="11"
                  fontWeight="600"
                  opacity="0.82"
                  className="text-foreground"
                >
                  Python
                </text>
              </g>

              {/* Tier 2 */}
              <g style={{ transform: `translate(${t2.x}px, ${t2.y}px)` }}>
                {[
                  { label: 'Next.js', y: 120 },
                  { label: 'Tailwind', y: 210 },
                  { label: 'Django', y: 300 },
                  { label: 'FastAPI', y: 390 },
                ].map((n) => (
                  <g key={n.label}>
                    <rect
                      x="611"
                      y={n.y}
                      width="74"
                      height="40"
                      rx="10"
                      fill="currentColor"
                      fillOpacity="0.045"
                      stroke="rgb(34,211,238)"
                      strokeOpacity="0.35"
                      strokeWidth="1.1"
                      className="text-foreground"
                    />
                    <text
                      x="648"
                      y={n.y + 25}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="10"
                      fontWeight="500"
                      opacity="0.7"
                      className="text-foreground"
                    >
                      {n.label}
                    </text>
                  </g>
                ))}
              </g>

              {/* Particles */}
              <circle cx="150" cy="160" r="1.2" fill="rgb(99,102,241)" opacity="0.2">
                <animate
                  attributeName="cy"
                  values="160;150;160"
                  dur="5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="820" cy="400" r="1" fill="rgb(34,211,238)" opacity="0.15">
                <animate
                  attributeName="cy"
                  values="400;390;400"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
