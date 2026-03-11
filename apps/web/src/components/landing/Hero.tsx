'use client';

import Link from 'next/link';
import { useRef, useState, useCallback, useEffect } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<MousePosition>({ x: 0, y: 0 });
  const [smoothMouse, setSmoothMouse] = useState<MousePosition>({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isTouchDevice) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Normalize to -1 to 1 range, centered
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMouse({ x, y });
    },
    [isTouchDevice],
  );

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: 0, y: 0 });
  }, []);

  // Smooth lerp animation for fluid motion
  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animate = () => {
      setSmoothMouse((prev) => ({
        x: lerp(prev.x, mouse.x, 0.08),
        y: lerp(prev.y, mouse.y, 0.08),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mouse]);

  // Parallax offsets per tier (deeper nodes move more = depth illusion)
  const tier0 = { x: smoothMouse.x * -3, y: smoothMouse.y * -3 };
  const tier1 = { x: smoothMouse.x * 6, y: smoothMouse.y * 4 };
  const tier2 = { x: smoothMouse.x * 12, y: smoothMouse.y * 8 };
  const tier3 = { x: smoothMouse.x * 20, y: smoothMouse.y * 14 };

  // Glow position (in SVG viewBox coordinates)
  const glowX = 480 + smoothMouse.x * 480;
  const glowY = 270 + smoothMouse.y * 270;

  return (
    <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground mb-6 sm:mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Now in public beta
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6 animate-fade-in">
          Your skills deserve <span className="text-gradient">a better map</span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 animate-slide-up leading-relaxed">
          Create stunning interactive skill trees. Visualize your expertise, track your growth, and
          share your journey with the world.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-medium transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] text-center min-h-[48px] flex items-center justify-center"
          >
            Start building — it&apos;s free
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl border border-border hover:border-border-light text-muted-foreground hover:text-foreground font-medium transition-all active:scale-[0.98] text-center min-h-[48px] flex items-center justify-center"
          >
            Explore examples
          </Link>
        </div>

        {/* Animated skill graph preview */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="mt-12 sm:mt-20 relative animate-slide-up"
        >
          <div className="absolute -inset-4 bg-gradient-to-t from-background via-background/20 to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-border/60 overflow-hidden bg-surface/50 backdrop-blur-sm aspect-video relative shadow-2xl shadow-primary/5">
            <svg
              className="w-full h-full"
              viewBox="0 0 960 540"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Subtle dot grid pattern */}
              <defs>
                <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <circle cx="16" cy="16" r="0.8" fill="currentColor" opacity="0.12" />
                </pattern>

                {/* Glow filters */}
                <filter id="glowPrimary" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="glowAccent" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08" />
                </filter>

                {/* Gradient for edges */}
                <linearGradient id="edgePrimary" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0.15" />
                </linearGradient>
                <linearGradient id="edgeAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="edgeTeal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0.1" />
                </linearGradient>

                {/* Mouse-follow radial glow */}
                <radialGradient id="mouseGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.12" />
                  <stop offset="40%" stopColor="rgb(34,211,238)" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                  <stop offset="50%" stopColor="rgb(99,102,241)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
                </linearGradient>
              </defs>

              <rect width="960" height="540" fill="url(#dotGrid)" className="text-foreground" />

              {/* ===== MOUSE-FOLLOWING GLOW ===== */}
              <ellipse
                cx={glowX}
                cy={glowY}
                rx="220"
                ry="180"
                fill="url(#mouseGlow)"
                style={{ transition: 'none' }}
              />

              {/* ===== EDGES (move with average of connected tiers) ===== */}
              <g
                style={{
                  transform: `translate(${(tier0.x + tier1.x) / 2}px, ${(tier0.y + tier1.y) / 2}px)`,
                }}
              >
                {/* Root → React */}
                <path
                  d="M 190 250 C 260 250, 280 155, 350 155"
                  stroke="url(#edgePrimary)"
                  strokeWidth="1.5"
                  fill="none"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.6;1;0.6"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2.5" fill="rgb(99,102,241)" opacity="0.7">
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path="M 190 250 C 260 250, 280 155, 350 155"
                  />
                </circle>

                {/* Root → Python */}
                <path
                  d="M 190 290 C 260 290, 280 385, 350 385"
                  stroke="url(#edgePrimary)"
                  strokeWidth="1.5"
                  fill="none"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.4;0.8;0.4"
                    dur="3.4s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2.5" fill="rgb(99,102,241)" opacity="0.6">
                  <animateMotion
                    dur="3.4s"
                    repeatCount="indefinite"
                    path="M 190 290 C 260 290, 280 385, 350 385"
                  />
                </circle>
              </g>

              <g
                style={{
                  transform: `translate(${(tier1.x + tier2.x) / 2}px, ${(tier1.y + tier2.y) / 2}px)`,
                }}
              >
                {/* React → Next.js */}
                <path
                  d="M 410 145 C 470 145, 490 110, 545 110"
                  stroke="url(#edgeAccent)"
                  strokeWidth="1.5"
                  fill="none"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.4;0.8;0.4"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2" fill="rgb(34,211,238)" opacity="0.6">
                  <animateMotion
                    dur="2.6s"
                    repeatCount="indefinite"
                    path="M 410 145 C 470 145, 490 110, 545 110"
                  />
                </circle>

                {/* React → Tailwind */}
                <path
                  d="M 410 165 C 470 165, 490 190, 545 190"
                  stroke="url(#edgeAccent)"
                  strokeWidth="1.5"
                  fill="none"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.5;0.85;0.5"
                    dur="3.1s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2" fill="rgb(34,211,238)" opacity="0.6">
                  <animateMotion
                    dur="3.1s"
                    repeatCount="indefinite"
                    path="M 410 165 C 470 165, 490 190, 545 190"
                  />
                </circle>

                {/* Node.js → Express */}
                <path
                  d="M 410 260 C 470 260, 490 270, 545 270"
                  stroke="url(#edgeAccent)"
                  strokeWidth="1.5"
                  fill="none"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.5;0.9;0.5"
                    dur="2.9s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2" fill="rgb(34,211,238)" opacity="0.6">
                  <animateMotion
                    dur="2.9s"
                    repeatCount="indefinite"
                    path="M 410 260 C 470 260, 490 270, 545 270"
                  />
                </circle>

                {/* Node.js → GraphQL */}
                <path
                  d="M 410 280 C 470 280, 490 345, 545 345"
                  stroke="url(#edgeAccent)"
                  strokeWidth="1.5"
                  fill="none"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.3;0.7;0.3"
                    dur="3.3s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2" fill="rgb(34,211,238)" opacity="0.5">
                  <animateMotion
                    dur="3.3s"
                    repeatCount="indefinite"
                    path="M 410 280 C 470 280, 490 345, 545 345"
                  />
                </circle>

                {/* Python → Django */}
                <path
                  d="M 410 380 C 470 380, 490 400, 545 400"
                  stroke="url(#edgeAccent)"
                  strokeWidth="1.5"
                  fill="none"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.4;0.75;0.4"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </path>
                <circle r="2" fill="rgb(34,211,238)" opacity="0.6">
                  <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path="M 410 380 C 470 380, 490 400, 545 400"
                  />
                </circle>
              </g>

              <g
                style={{
                  transform: `translate(${(tier2.x + tier3.x) / 2}px, ${(tier2.y + tier3.y) / 2}px)`,
                }}
              >
                {/* Next.js → Vercel */}
                <path
                  d="M 605 110 C 650 110, 670 90, 720 90"
                  stroke="url(#edgeTeal)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.6"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.3;0.6;0.3"
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Tailwind → Radix */}
                <path
                  d="M 605 190 C 650 190, 670 165, 720 165"
                  stroke="url(#edgeTeal)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.6"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.3;0.55;0.3"
                    dur="2.7s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Express → Prisma */}
                <path
                  d="M 605 270 C 650 270, 670 255, 720 255"
                  stroke="url(#edgeTeal)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.6"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.3;0.6;0.3"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* GraphQL → Apollo */}
                <path
                  d="M 605 345 C 650 345, 670 330, 720 330"
                  stroke="url(#edgeTeal)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.6"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.25;0.5;0.25"
                    dur="3.8s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Django → REST */}
                <path
                  d="M 605 400 C 650 400, 670 415, 720 415"
                  stroke="url(#edgeTeal)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.6"
                >
                  <animate
                    attributeName="stroke-opacity"
                    values="0.3;0.55;0.3"
                    dur="2.9s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>

              {/* ===== ROOT NODE (Tier 0) ===== */}
              <g
                style={{
                  transform: `translate(${tier0.x}px, ${tier0.y}px)`,
                }}
              >
                <g filter="url(#glowPrimary)">
                  <rect
                    x="128"
                    y="238"
                    width="64"
                    height="64"
                    rx="12"
                    fill="rgb(99,102,241)"
                    fillOpacity="0.12"
                    stroke="rgb(99,102,241)"
                    strokeOpacity="0.6"
                    strokeWidth="2"
                  >
                    <animate
                      attributeName="width"
                      values="60;68;60"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="height"
                      values="60;68;60"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="x"
                      values="130;126;130"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y"
                      values="240;236;240"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="stroke-opacity"
                      values="0.4;0.8;0.4"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </rect>

                  <rect
                    x="142"
                    y="252"
                    width="36"
                    height="36"
                    rx="8"
                    fill="rgb(99,102,241)"
                    fillOpacity="0.2"
                    stroke="none"
                  >
                    <animate
                      attributeName="fill-opacity"
                      values="0.15;0.3;0.15"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </rect>

                  <text
                    x="160"
                    y="274"
                    textAnchor="middle"
                    fill="rgb(99,102,241)"
                    fontSize="12"
                    fontWeight="700"
                    letterSpacing="0.5"
                  >
                    Core
                  </text>
                </g>
              </g>

              {/* ===== TIER 1 NODES ===== */}
              <g
                style={{
                  transform: `translate(${tier1.x}px, ${tier1.y}px)`,
                }}
              >
                {/* React */}
                <g filter="url(#softShadow)">
                  <rect
                    x="350"
                    y="131"
                    width="60"
                    height="38"
                    rx="10"
                    fill="currentColor"
                    fillOpacity="0.04"
                    stroke="rgb(99,102,241)"
                    strokeOpacity="0.35"
                    strokeWidth="1.5"
                    className="text-foreground"
                  />
                  <text
                    x="380"
                    y="157"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="11"
                    fontWeight="500"
                    opacity="0.75"
                    className="text-foreground"
                  >
                    React
                  </text>
                </g>

                {/* Node.js */}
                <g filter="url(#softShadow)">
                  <rect
                    x="350"
                    y="249"
                    width="60"
                    height="38"
                    rx="10"
                    fill="currentColor"
                    fillOpacity="0.04"
                    stroke="rgb(99,102,241)"
                    strokeOpacity="0.35"
                    strokeWidth="1.5"
                    className="text-foreground"
                  />
                  <text
                    x="380"
                    y="275"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="11"
                    fontWeight="500"
                    opacity="0.75"
                    className="text-foreground"
                  >
                    Node.js
                  </text>
                </g>

                {/* Python */}
                <g filter="url(#softShadow)">
                  <rect
                    x="350"
                    y="365"
                    width="60"
                    height="38"
                    rx="10"
                    fill="currentColor"
                    fillOpacity="0.04"
                    stroke="rgb(99,102,241)"
                    strokeOpacity="0.35"
                    strokeWidth="1.5"
                    className="text-foreground"
                  />
                  <text
                    x="380"
                    y="391"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="11"
                    fontWeight="500"
                    opacity="0.75"
                    className="text-foreground"
                  >
                    Python
                  </text>
                </g>
              </g>

              {/* ===== TIER 2 NODES ===== */}
              <g
                style={{
                  transform: `translate(${tier2.x}px, ${tier2.y}px)`,
                }}
              >
                {/* Next.js */}
                <g filter="url(#softShadow)">
                  <rect
                    x="545"
                    y="91"
                    width="60"
                    height="36"
                    rx="8"
                    fill="currentColor"
                    fillOpacity="0.03"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="575"
                    y="114"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="10"
                    fontWeight="500"
                    opacity="0.6"
                    className="text-foreground"
                  >
                    Next.js
                  </text>
                </g>

                {/* Tailwind */}
                <g filter="url(#softShadow)">
                  <rect
                    x="545"
                    y="171"
                    width="60"
                    height="36"
                    rx="8"
                    fill="currentColor"
                    fillOpacity="0.03"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="575"
                    y="194"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="10"
                    fontWeight="500"
                    opacity="0.6"
                    className="text-foreground"
                  >
                    Tailwind
                  </text>
                </g>

                {/* Express */}
                <g filter="url(#softShadow)">
                  <rect
                    x="545"
                    y="251"
                    width="60"
                    height="36"
                    rx="8"
                    fill="currentColor"
                    fillOpacity="0.03"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="575"
                    y="274"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="10"
                    fontWeight="500"
                    opacity="0.6"
                    className="text-foreground"
                  >
                    Express
                  </text>
                </g>

                {/* GraphQL */}
                <g filter="url(#softShadow)">
                  <rect
                    x="545"
                    y="326"
                    width="60"
                    height="36"
                    rx="8"
                    fill="currentColor"
                    fillOpacity="0.03"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="575"
                    y="349"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="10"
                    fontWeight="500"
                    opacity="0.6"
                    className="text-foreground"
                  >
                    GraphQL
                  </text>
                </g>

                {/* Django */}
                <g filter="url(#softShadow)">
                  <rect
                    x="545"
                    y="381"
                    width="60"
                    height="36"
                    rx="8"
                    fill="currentColor"
                    fillOpacity="0.03"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="575"
                    y="404"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="10"
                    fontWeight="500"
                    opacity="0.6"
                    className="text-foreground"
                  >
                    Django
                  </text>
                </g>
              </g>

              {/* ===== TIER 3 NODES ===== */}
              <g
                style={{
                  transform: `translate(${tier3.x}px, ${tier3.y}px)`,
                }}
              >
                {/* Vercel */}
                <g>
                  <rect
                    x="720"
                    y="74"
                    width="52"
                    height="30"
                    rx="7"
                    fill="currentColor"
                    fillOpacity="0.02"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.18"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="746"
                    y="93"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="9"
                    fontWeight="400"
                    opacity="0.45"
                    className="text-foreground"
                  >
                    Vercel
                  </text>
                </g>

                {/* Radix */}
                <g>
                  <rect
                    x="720"
                    y="149"
                    width="52"
                    height="30"
                    rx="7"
                    fill="currentColor"
                    fillOpacity="0.02"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.18"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="746"
                    y="168"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="9"
                    fontWeight="400"
                    opacity="0.45"
                    className="text-foreground"
                  >
                    Radix
                  </text>
                </g>

                {/* Prisma */}
                <g>
                  <rect
                    x="720"
                    y="239"
                    width="52"
                    height="30"
                    rx="7"
                    fill="currentColor"
                    fillOpacity="0.02"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.18"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="746"
                    y="258"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="9"
                    fontWeight="400"
                    opacity="0.45"
                    className="text-foreground"
                  >
                    Prisma
                  </text>
                </g>

                {/* Apollo */}
                <g>
                  <rect
                    x="720"
                    y="314"
                    width="52"
                    height="30"
                    rx="7"
                    fill="currentColor"
                    fillOpacity="0.02"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.18"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="746"
                    y="333"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="9"
                    fontWeight="400"
                    opacity="0.45"
                    className="text-foreground"
                  >
                    Apollo
                  </text>
                </g>

                {/* REST API */}
                <g>
                  <rect
                    x="720"
                    y="399"
                    width="52"
                    height="30"
                    rx="7"
                    fill="currentColor"
                    fillOpacity="0.02"
                    stroke="rgb(34,211,238)"
                    strokeOpacity="0.18"
                    strokeWidth="1"
                    className="text-foreground"
                  />
                  <text
                    x="746"
                    y="418"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="9"
                    fontWeight="400"
                    opacity="0.45"
                    className="text-foreground"
                  >
                    REST
                  </text>
                </g>
              </g>

              {/* ===== Floating decorative particles (move with different speeds) ===== */}
              <g
                style={{
                  transform: `translate(${smoothMouse.x * -8}px, ${smoothMouse.y * -6}px)`,
                }}
              >
                <circle cx="90" cy="140" r="1.5" fill="rgb(99,102,241)" opacity="0.3">
                  <animate
                    attributeName="cy"
                    values="140;130;140"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.2;0.5;0.2"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="480" cy="470" r="1.5" fill="rgb(99,102,241)" opacity="0.2">
                  <animate
                    attributeName="opacity"
                    values="0.1;0.35;0.1"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="300" cy="80" r="1" fill="rgb(34,211,238)" opacity="0.2">
                  <animate
                    attributeName="cy"
                    values="80;72;80"
                    dur="5.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>

              <g
                style={{
                  transform: `translate(${smoothMouse.x * 15}px, ${smoothMouse.y * 10}px)`,
                }}
              >
                <circle cx="850" cy="120" r="1" fill="rgb(34,211,238)" opacity="0.25">
                  <animate
                    attributeName="cy"
                    values="120;110;120"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="130" cy="430" r="1" fill="rgb(34,211,238)" opacity="0.2">
                  <animate
                    attributeName="cy"
                    values="430;420;430"
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="870" cy="400" r="1.5" fill="rgb(99,102,241)" opacity="0.15">
                  <animate
                    attributeName="opacity"
                    values="0.1;0.3;0.1"
                    dur="4.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="680" cy="480" r="1" fill="rgb(99,102,241)" opacity="0.2">
                  <animate
                    attributeName="opacity"
                    values="0.15;0.35;0.15"
                    dur="3.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
