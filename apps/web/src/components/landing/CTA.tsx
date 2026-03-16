import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 relative ">
      <div
        className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full blur-3xl opacity-[0.06] pointer-events-none"
        style={{ background: '#8b22ee' }}
      />
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to map your skills?</h2>
        <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
          Free forever for your first graph. No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-primary hover:bg-primary-600 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98] text-center min-h-[48px] flex items-center justify-center"
          >
            Get started free
          </Link>
          <Link
            href="/templates"
            className="w-full sm:w-auto px-7 py-3 rounded-xl border border-border hover:border-border-light text-muted-foreground hover:text-foreground text-sm font-medium transition-all active:scale-[0.98] text-center min-h-[48px] flex items-center justify-center"
          >
            Browse templates
          </Link>
        </div>
      </div>
    </section>
  );
}
