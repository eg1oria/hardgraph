const steps = [
  {
    number: '01',
    title: 'Pick a template or start blank',
    description: 'Curated skill trees for your field, or a clean canvas.',
  },
  {
    number: '02',
    title: 'Map your skills visually',
    description: 'Drag, connect, and organize in an interactive graph editor.',
  },
  {
    number: '03',
    title: 'Share with the world',
    description: 'Publish and share a beautiful link with anyone.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground text-center mb-3">
          How it works
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-14 sm:mb-20">
          Three steps to your skill map
        </h2>

        <div className="grid md:grid-cols-3 gap-px bg-border/50 rounded-2xl overflow-hidden border border-border/50">
          {steps.map((step) => (
            <div key={step.number} className="relative p-8 bg-background group">
              <span className="text-[11px] font-mono tracking-wider text-primary/60 mb-4 block">
                {step.number}
              </span>
              <h3 className="text-[15px] font-semibold mb-2 leading-snug">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
