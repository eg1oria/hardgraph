'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  User,
  BookTemplate,
  Rocket,
  X,
  Check,
  Code2,
  Palette,
  Briefcase,
  Music,
  GraduationCap,
  Compass,
  Github,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';

/* ─── Types ─── */

interface Template {
  id: string;
  name: string;
  description: string | null;
  field: string | null;
  isFeatured: boolean;
  graphData: Record<string, unknown>;
}

/* ─── Constants ─── */

const FIELD_GROUPS = [
  {
    group: 'Technology',
    icon: Code2,
    description: 'Software, data, DevOps, and cybersecurity',
    fields: ['frontend', 'backend', 'devops', 'data', 'mobile', 'fullstack', 'cybersecurity'],
  },
  {
    group: 'Design',
    icon: Palette,
    description: 'UI/UX, graphic design, and visual arts',
    fields: ['uiux', 'graphic'],
  },
  {
    group: 'Business',
    icon: Briefcase,
    description: 'Marketing, product, project management, finance',
    fields: ['marketing', 'product', 'project', 'finance'],
  },
  {
    group: 'Creative',
    icon: Music,
    description: 'Music, video production, and photography',
    fields: ['music', 'video', 'photography'],
  },
  {
    group: 'Professional',
    icon: GraduationCap,
    description: 'Medicine, education, law, and engineering',
    fields: ['medical', 'education', 'legal', 'engineering'],
  },
];

const FIELD_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  devops: 'DevOps',
  data: 'Data Science',
  mobile: 'Mobile',
  fullstack: 'Fullstack',
  cybersecurity: 'Cybersecurity',
  uiux: 'UI/UX Design',
  graphic: 'Graphic Design',
  marketing: 'Marketing',
  product: 'Product Management',
  project: 'Project Management',
  finance: 'Finance',
  music: 'Music',
  video: 'Video Production',
  photography: 'Photography',
  medical: 'Medicine',
  education: 'Education',
  legal: 'Legal',
  engineering: 'Engineering',
};

const STEP_META = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'field', label: 'Field', icon: Compass },
  { id: 'template', label: 'Template', icon: BookTemplate },
  { id: 'launch', label: 'Launch', icon: Rocket },
] as const;

const TOTAL_STEPS = STEP_META.length;
const SWIPE_THRESHOLD = 50;
const SESSION_KEY = 'hardgraph_onboarding_step';

/* ─── Animation variants ─── */

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '60%' : '-60%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '60%' : '-60%',
    opacity: 0,
  }),
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/* ─── Reduced-motion detector ─── */

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefers;
}

/* ─── Decorative background blobs ─── */

function BackgroundDecoration() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {/* Top-right gradient orb */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.07] dark:opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
        }}
      />
      {/* Bottom-left gradient orb */}
      <div
        className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full opacity-[0.06] dark:opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
        }}
      />
      {/* Center-bottom soft wash */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-48 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          background:
            'radial-gradient(ellipse at center bottom, hsl(var(--primary)) 0%, transparent 80%)',
        }}
      />
    </div>
  );
}

/* ─── Component ─── */

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const reducedMotion = usePrefersReducedMotion();

  /* State */
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  /* Touch tracking refs */
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const touchDeltaX = useRef(0);
  const touchDeltaY = useRef(0);

  /* ─── Restore step from session ─── */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 0 && parsed < TOTAL_STEPS) {
          setStep(parsed);
        }
      }
    } catch {
      // SSR or storage unavailable
    }
  }, []);

  /* ─── Persist step to session ─── */
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, String(step));
    } catch {
      // ignore
    }
  }, [step]);

  /* ─── Redirect if already onboarded ─── */
  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  /* ─── Pre-fill from current user ─── */
  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  /* ─── Load templates ─── */
  useEffect(() => {
    api
      .get<Template[]>('/templates')
      .then((data) => setTemplates(data))
      .catch(() => {
        // Leave templates empty; onboarding handles empty state.
      })
      .finally(() => setLoadingTemplates(false));
  }, []);

  /* ─── Navigation helpers ─── */
  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const goPrev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  /* ─── Touch handlers for swipe ─── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
    touchDeltaX.current = 0;
    touchDeltaY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    touchDeltaX.current = deltaX;
    touchDeltaY.current = deltaY;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    // Lock into horizontal swipe only if horizontal movement clearly dominates.
    // This avoids fighting vertical scroll, especially inside the templates list.
    if (absX > 12 && absX > absY * 1.25) {
      isSwiping.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping.current || !e.changedTouches[0]) return;
      const deltaX = touchDeltaX.current || e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = touchDeltaY.current || e.changedTouches[0].clientY - touchStartY.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Final guard: only act on intentional horizontal swipes.
      if (absX >= SWIPE_THRESHOLD && absX > absY * 1.25) {
        if (deltaX < 0) {
          goNext();
        } else goPrev();
      }
    },
    [goNext, goPrev],
  );

  /* ─── Keyboard navigation ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  /* ─── Completion logic ─── */
  const completeOnboarding = useCallback(
    async (skipTemplate = false) => {
      if (isCompleting) return;
      setIsCompleting(true);
      setLoading(true);
      setError('');

      try {
        // 1. Update profile
        await api.patch('/users/me', {
          displayName: displayName.trim() || undefined,
          bio: bio.trim() || undefined,
          onboardingCompleted: true,
        });

        // 2. Optionally use a template
        let graphId: string | null = null;
        if (!skipTemplate && selectedTemplate) {
          const res = await api.post<{ id: string }>(`/templates/${selectedTemplate}/use`);
          graphId = res.id;
        }

        // 3. Update client-side user state
        if (user) {
          setUser({
            ...user,
            displayName: displayName.trim() || user.displayName,
            onboardingCompleted: true,
          });
        }

        // 4. Clean up session storage
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          // ignore
        }

        toast('Welcome to HardGraph! 🎉', 'success');
        router.push(graphId ? `/editor/${graphId}` : '/dashboard');
      } catch {
        setError('Something went wrong. Please try again.');
        toast('Something went wrong', 'error');
        setIsCompleting(false);
      } finally {
        setLoading(false);
      }
    },
    [displayName, bio, selectedTemplate, user, setUser, router, toast, isCompleting],
  );

  const handleSkip = useCallback(() => {
    completeOnboarding(true);
  }, [completeOnboarding]);

  const handleFinish = useCallback(() => {
    completeOnboarding(false);
  }, [completeOnboarding]);

  /* ─── Animation config ─── */
  const transition = reducedMotion
    ? { duration: 0.01 }
    : { type: 'spring', stiffness: 350, damping: 35, mass: 0.8 };

  const isLast = step === TOTAL_STEPS - 1;
  const isFirst = step === 0;

  return (
    <div
      className="fixed inset-0 bg-background flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <BackgroundDecoration />

      {/* ─── Top bar ─── */}
      <motion.header
        className="relative z-10 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3"
        initial={false}
        animate={{ opacity: 1 }}
      >
        {/* Step label */}
        <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase select-none">
          Step {step + 1} of {TOTAL_STEPS}
        </span>

        {/* Skip button — visible on all steps */}
        <button
          onClick={handleSkip}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg px-3 py-2 hover:bg-surface-light min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
          aria-label="Skip onboarding"
        >
          Skip
          <X className="w-4 h-4" />
        </button>
      </motion.header>

      {/* ─── Main content area ─── */}
      <main
        className="relative z-10 flex-1 flex items-center justify-center px-5 overflow-hidden pb-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="w-full max-w-lg mx-auto"
          >
            <div className="max-h-[80dvh] sm:max-h-none overflow-y-auto overscroll-contain scrollbar-hide">
              {/* ── Step 0: Welcome / Profile ── */}
              {step === 0 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1, duration: 0.35 }}
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/10 flex items-center justify-center shadow-lg shadow-primary/5">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="text-center mb-5 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
                      Welcome to <span className="text-gradient">HardGraph</span>
                    </h1>
                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-sm mx-auto">
                      Build interactive skill trees that showcase your expertise and inspire others.
                    </p>
                  </div>

                  {/* Form */}
                  <div className="space-y-4 rounded-2xl bg-surface/80 dark:bg-surface/60 backdrop-blur-sm border border-border p-5 shadow-sm">
                    <div>
                      <label
                        htmlFor="onboarding-displayname"
                        className="block text-sm font-medium text-muted-foreground mb-1.5"
                      >
                        Display Name
                      </label>
                      <input
                        id="onboarding-displayname"
                        className="input-field"
                        placeholder="e.g. John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        autoFocus
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="onboarding-bio"
                        className="block text-sm font-medium text-muted-foreground mb-1.5"
                      >
                        Bio <span className="text-muted">(optional)</span>
                      </label>
                      <textarea
                        id="onboarding-bio"
                        className="input-field resize-none"
                        rows={3}
                        placeholder="Passionate about design and technology..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 1: Choose Your Field ── */}
              {step === 1 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1, duration: 0.35 }}
                >
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-primary/20 border border-cyan-500/10 flex items-center justify-center shadow-lg shadow-cyan-500/5">
                      <Compass className="w-10 h-10 text-cyan-500" />
                    </div>
                  </div>

                  <div className="text-center mb-5 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                      Choose your field
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
                      Select your professional area to see relevant templates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[45vh] overflow-y-auto -mx-1 px-1 pb-1">
                    {FIELD_GROUPS.map((g) => {
                      const Icon = g.icon;
                      return (
                        <button
                          key={g.group}
                          onClick={() =>
                            setSelectedField(selectedField === g.group ? null : g.group)
                          }
                          className={`text-left p-4 rounded-xl border-2 transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                            selectedField === g.group
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-md shadow-primary/5'
                              : 'border-border hover:border-primary/30 bg-surface/80 dark:bg-surface/60 backdrop-blur-sm hover:shadow-sm'
                          }`}
                          aria-pressed={selectedField === g.group}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm mb-0.5 flex items-center gap-2">
                                {g.group}
                                {selectedField === g.group && (
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {g.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom / blank option */}
                    <button
                      onClick={() => setSelectedField(selectedField === 'custom' ? null : 'custom')}
                      className={`text-left p-4 rounded-xl border-2 transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                        selectedField === 'custom'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-md shadow-primary/5'
                          : 'border-border hover:border-primary/30 bg-surface/80 dark:bg-surface/60 backdrop-blur-sm hover:shadow-sm'
                      }`}
                      aria-pressed={selectedField === 'custom'}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-0.5 flex items-center gap-2">
                            Other / Custom
                            {selectedField === 'custom' && (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground">Start with a blank canvas</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Choose Template ── */}
              {step === 2 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1, duration: 0.35 }}
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/10 flex items-center justify-center shadow-lg shadow-accent/5">
                      <BookTemplate className="w-10 h-10 text-accent-500" />
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="text-center mb-5 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                      Pick a starter template
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
                      Choose one to get started quickly, or skip to create from scratch.
                    </p>
                  </div>

                  {/* Templates grid */}
                  {loadingTemplates ? (
                    <div className="flex justify-center py-12">
                      <Spinner size="lg" className="text-primary" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      <p>No templates available yet.</p>
                      <p className="mt-1">You can create your skill tree from scratch!</p>
                    </div>
                  ) : (
                    (() => {
                      const selectedGroup = FIELD_GROUPS.find((g) => g.group === selectedField);
                      const filteredTemplates =
                        selectedField && selectedField !== 'custom' && selectedGroup
                          ? templates.filter(
                              (t) => t.field && selectedGroup.fields.includes(t.field),
                            )
                          : templates;
                      return filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          <p>No templates for this field yet.</p>
                          <p className="mt-1">You can create your skill tree from scratch!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto -mx-1 px-1 pb-1">
                          {filteredTemplates.map((t) => (
                            <button
                              key={t.id}
                              onClick={() =>
                                setSelectedTemplate(selectedTemplate === t.id ? null : t.id)
                              }
                              className={`text-left p-4 rounded-xl border-2 transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                                selectedTemplate === t.id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-md shadow-primary/5'
                                  : 'border-border hover:border-primary/30 bg-surface/80 dark:bg-surface/60 backdrop-blur-sm hover:shadow-sm'
                              }`}
                              aria-pressed={selectedTemplate === t.id}
                              aria-label={`Template: ${t.name}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0 mt-1">
                                  {FIELD_LABELS[t.field ?? ''] ?? 'General'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                                    {t.name}
                                    {selectedTemplate === t.id && (
                                      <Check className="w-4 h-4 text-primary shrink-0" />
                                    )}
                                  </h3>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {t.description}
                                  </p>
                                </div>
                              </div>
                              {t.isFeatured && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400">
                                  <Sparkles className="w-3 h-3" />
                                  Featured
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      );
                    })()
                  )}

                  {/* Skip template link */}
                  <p className="text-center mt-5 text-xs text-muted-foreground">
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        goNext();
                      }}
                      className="underline hover:text-foreground transition-colors py-1 px-2 rounded min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      Skip — I&apos;ll start from scratch
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ── Step 3: Launch ── */}
              {step === 3 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1, duration: 0.35 }}
                  className="text-center"
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/10 flex items-center justify-center shadow-xl shadow-primary/10">
                      <Rocket className="w-12 h-12 text-primary" />
                    </div>
                  </div>

                  {/* Heading */}
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                    You&apos;re all set!
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm mx-auto mb-6">
                    {selectedTemplate
                      ? "We'll create your first skill tree from the chosen template."
                      : "You'll start with a blank canvas — add nodes and build your skill tree."}
                  </p>

                  {/* Summary card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface/80 dark:bg-surface/60 backdrop-blur-sm border border-border text-left text-sm space-y-3 shadow-sm max-w-sm mx-auto">
                    {displayName && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Name</span>
                          <p className="font-medium leading-tight">{displayName}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <BookTemplate className="w-4 h-4 text-accent-500" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Template</span>
                        <p className="font-medium leading-tight">
                          {selectedTemplate
                            ? templates.find((t) => t.id === selectedTemplate)?.name
                            : 'Blank canvas'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error state */}
                  {error && (
                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm max-w-sm mx-auto flex items-center gap-2">
                      <span className="shrink-0">⚠️</span>
                      <span>{error}</span>
                      <button
                        onClick={handleFinish}
                        disabled={loading}
                        className="ml-auto text-xs font-medium underline hover:text-red-300 transition-colors min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        aria-label="Retry completing onboarding"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── Footer: buttons + dots ─── */}
      <footer className="relative z-10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 border-t border-border/50">
        {/* Global error banner (covers Skip/Finish failures on any step) */}
        {error && step !== 3 && (
          <div className="max-w-lg mx-auto mb-4">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm flex items-center gap-2">
              <span className="shrink-0" aria-hidden="true">
                ⚠️
              </span>
              <span>{error}</span>
              <button
                onClick={() => {
                  if (isCompleting) return;
                  setError('');
                }}
                className="ml-auto text-xs font-medium underline hover:text-red-300 transition-colors min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3 mb-5 max-w-lg mx-auto">
          {!isFirst ? (
            <button
              onClick={goPrev}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl px-5 py-3 border border-border bg-surface hover:bg-surface-light min-h-[48px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
              aria-label="Go to previous step"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all rounded-xl px-6 py-3 min-h-[48px] shadow-lg shadow-primary/20 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Complete onboarding and start using the app"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Launching…
                </>
              ) : (
                <>
                  Start using the app
                  <Rocket className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-primary hover:bg-primary-600 transition-colors rounded-xl px-6 py-3 min-h-[48px] shadow-lg shadow-primary/20 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Go to next step"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress dots */}
        <nav
          className="flex items-center justify-center gap-2.5"
          role="tablist"
          aria-label="Onboarding progress"
        >
          {STEP_META.map((s, i) => {
            const isCurrent = i === step;
            const isCompleted = i < step;

            return (
              <button
                key={s.id}
                onClick={() => {
                  setDirection(i > step ? 1 : -1);
                  setStep(i);
                }}
                disabled={loading}
                className="group p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`${s.label} (step ${i + 1})${isCompleted ? ', completed' : isCurrent ? ', current' : ''}`}
              >
                {isCompleted ? (
                  /* Completed: small circle with checkmark */
                  <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center transition-all duration-300">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : isCurrent ? (
                  /* Current: wider pill indicator */
                  <div className="h-2.5 w-9 rounded-full bg-primary shadow-sm shadow-primary/30 transition-all duration-300" />
                ) : (
                  /* Upcoming: small muted dot with ring */
                  <div className="w-2.5 h-2.5 rounded-full bg-border ring-1 ring-border-light group-hover:bg-muted-foreground/30 transition-all duration-300" />
                )}
              </button>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
