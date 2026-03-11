'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Sparkles, User, BookTemplate, Rocket } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';

interface Template {
  id: string;
  name: string;
  description: string | null;
  field: string | null;
  isFeatured: boolean;
  graphData: Record<string, unknown>;
}

const FIELD_ICONS: Record<string, string> = {
  frontend: '⚛️',
  backend: '🚀',
  devops: '🐳',
  data: '🧠',
};

const steps = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'template', label: 'Template', icon: BookTemplate },
  { id: 'launch', label: 'Launch', icon: Rocket },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Redirect if already onboarded
  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  // Pre-fill from current user
  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName);
  }, [user]);

  // Load templates
  useEffect(() => {
    api
      .get<Template[]>('/templates')
      .then((res) => setTemplates(res.data))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, []);

  const handleFinish = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Update profile
      await api.patch('/users/me', {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        onboardingCompleted: true,
      });

      // 2. Optionally use a template
      let graphId: string | null = null;
      if (selectedTemplate) {
        const res = await api.post<{ id: string }>(`/templates/${selectedTemplate}/use`);
        graphId = res.data.id;
      }

      // 3. Update client-side user state
      if (user) {
        setUser({
          ...user,
          displayName: displayName.trim() || user.displayName,
          onboardingCompleted: true,
        });
      }

      toast('Welcome to Skillgraph! 🎉', 'success');

      // Navigate to editor if template was used, otherwise dashboard
      router.push(graphId ? `/editor/${graphId}` : '/dashboard');
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  }, [displayName, bio, selectedTemplate, user, setUser, router, toast]);

  const canNext = step === 0 ? true : step === 1 ? true : true;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 sm:py-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 sm:mb-10">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                i <= step ? 'bg-primary text-white' : 'bg-surface-light text-muted-foreground'
              }`}
            >
              <s.icon className="w-4 h-4" />
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 rounded-full transition-all ${
                  i < step ? 'bg-primary' : 'bg-surface-light'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-lg">
        {/* Step 0: Profile */}
        {step === 0 && (
          <div className="animate-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome to <span className="text-gradient">Skillgraph</span>
              </h1>
              <p className="text-muted-foreground">Tell us a bit about yourself</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Display Name
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Bio <span className="text-muted">(optional)</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Full-stack developer passionate about..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Choose template */}
        {step === 1 && (
          <div className="animate-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose a starter template</h2>
              <p className="text-muted-foreground text-sm">
                Pick one to get started quickly, or skip to create from scratch
              </p>
            </div>

            {loadingTemplates ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" className="text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedTemplate === t.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/30 bg-surface'
                    }`}
                  >
                    <div className="text-2xl mb-2">{FIELD_ICONS[t.field ?? ''] ?? '📋'}</div>
                    <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                    {t.isFeatured && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Launch */}
        {step === 2 && (
          <div className="animate-in text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
            <p className="text-muted-foreground text-sm mb-2">
              {selectedTemplate
                ? "We'll create your first skill tree from the chosen template."
                : "You'll start with a blank canvas — add nodes and build your skill tree."}
            </p>
            <div className="mt-8 p-4 rounded-xl bg-surface border border-border text-left text-sm space-y-2">
              {displayName && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{displayName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Template:</span>
                <span className="font-medium">
                  {selectedTemplate
                    ? templates.find((t) => t.id === selectedTemplate)?.name
                    : 'Blank canvas'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary" disabled={!canNext}>
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <Spinner size="sm" /> Launching...
                </>
              ) : (
                <>
                  Launch <Rocket className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Skip link */}
        {step === 1 && (
          <p className="text-center mt-4 text-xs text-muted-foreground">
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setStep(2);
              }}
              className="underline hover:text-foreground transition-colors"
            >
              Skip — I&apos;ll start from scratch
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
