import { Zap, Share2, Palette, LayoutGrid, Globe, Lock } from 'lucide-react';

const features = [
  {
    icon: LayoutGrid,
    title: 'Visual Skill Trees',
    description:
      'Drag-and-drop node editor with auto-layout. Organize skills into categories with custom colors.',
  },
  {
    icon: Palette,
    title: 'Beautiful Themes',
    description:
      'Choose from curated themes like Cyberpunk, Neon, Ocean — or create your own custom look.',
  },
  {
    icon: Share2,
    title: 'Share Anywhere',
    description:
      'Public profile page with unique URL. Embed your skill tree in portfolios, resumes, and social media.',
  },
  {
    icon: Zap,
    title: 'Instant Templates',
    description:
      'Start from templates for Frontend, Backend, DevOps, Design, and more. Customize to make it yours.',
  },
  {
    icon: Globe,
    title: 'Community Explore',
    description:
      'Discover what others are learning. Get inspired by skill trees from developers around the world.',
  },
  {
    icon: Lock,
    title: 'Your Data, Your Control',
    description:
      "Export your graph data as JSON or image. Choose what's public and what stays private.",
  },
];

export function Features() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            Everything you need to <span className="text-gradient">showcase your skills</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            A complete toolkit for creating, customizing, and sharing interactive skill
            visualizations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl bg-surface/50 border border-border hover:border-border-light transition-all hover:glow-primary"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
