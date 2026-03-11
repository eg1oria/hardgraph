import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-3xl mx-auto text-center relative">
        {/* Glow background */}
        <div className="absolute -inset-20 bg-primary/5 rounded-full blur-[100px]" />

        <div className="relative">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Ready to map your skills?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-lg mx-auto">
            Join developers, designers, and learners who are building beautiful skill
            visualizations. Free forever for your first graph.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-600 text-white font-medium transition-all hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] text-center min-h-[48px] flex items-center justify-center"
            >
              Get started for free
            </Link>
            <Link
              href="/templates"
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl border border-border hover:border-border-light text-muted-foreground hover:text-foreground font-medium transition-all active:scale-[0.98] text-center min-h-[48px] flex items-center justify-center"
            >
              Browse templates
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted">No credit card required. Set up in 30 seconds.</p>
        </div>
      </div>
    </section>
  );
}
