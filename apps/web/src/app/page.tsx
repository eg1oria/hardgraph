import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';
import { Navbar } from '@/components/landing/Navbar';
import { RedirectIfAuthenticated } from '@/components/landing/RedirectIfAuthenticated';

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background">
      <RedirectIfAuthenticated />
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-white focus:text-sm"
      >
        Skip to content
      </a>
      <Navbar />

      <div id="hero">
        <Hero />
      </div>
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
