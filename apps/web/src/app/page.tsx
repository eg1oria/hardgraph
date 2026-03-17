import { lazy, Suspense } from 'react';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';
import { Navbar } from '@/components/landing/Navbar';
import { RedirectIfAuthenticated } from '@/components/landing/RedirectIfAuthenticated';

// Lazy-load SeeItYourself — it imports ReactFlow (~200KB), not needed for initial viewport
const SeeItYourself = lazy(() =>
  import('@/components/landing/Seeityourself').then((m) => ({ default: m.SeeItYourself })),
);

export default function HomePage() {
  return (
    <main className="bg-background">
      <RedirectIfAuthenticated />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-white focus:text-sm"
      >
        Skip to content
      </a>
      <Navbar />

      <div id="main-content">
        <Hero />
      </div>
      <HowItWorks />
      <Suspense fallback={<div className="py-20 sm:py-32" />}>
        <SeeItYourself />
      </Suspense>
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
