const steps = [
  {
    number: '01',
    title: 'Pick a template or start blank',
    description: 'Choose from curated skill trees for your field or start from scratch.',
  },
  {
    number: '02',
    title: 'Map your skills visually',
    description: 'Drag, connect, and organize skills in an interactive graph editor.',
  },
  {
    number: '03',
    title: 'Share your skill tree',
    description: 'Publish your graph and share a beautiful link with anyone.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Three steps to your skill map
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            From zero to a shareable skill tree in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative p-6 rounded-xl bg-surface border border-border hover:border-border-light transition-colors group"
            >
              <span className="text-5xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold mt-4 mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
