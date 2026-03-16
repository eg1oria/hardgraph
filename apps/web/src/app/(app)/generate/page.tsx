'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, Github, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

type Step = 'check' | 'analyzing' | 'building' | 'done' | 'error';

interface GenerateResult {
  graphId: string;
  graphSlug: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<Step>('check');
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<GenerateResult | null>(null);

  const hasGithub = !!user?.githubUsername;

  useEffect(() => {
    if (!user) return;
    if (!hasGithub) return;

    // Auto-start generation when github is connected
    startGeneration();
  }, [user, hasGithub]);

  async function startGeneration() {
    try {
      setStep('analyzing');
      setError('');

      // Small delay for smooth UX
      await new Promise((r) => setTimeout(r, 800));
      setStep('building');

      const res = await api.post<GenerateResult>('/generate/from-github');
      setResult(res);
      setStep('done');

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push(`/editor/${res.graphId}`);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate skill tree';
      setError(message);
      setStep('error');
    }
  }

  const steps: Array<{ key: Step; label: string }> = [
    { key: 'check', label: 'Connecting to GitHub...' },
    { key: 'analyzing', label: 'Analyzing repositories...' },
    { key: 'building', label: 'Building your skill tree...' },
    { key: 'done', label: 'Done!' },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Generate Skill Tree</h1>
          <p className="text-muted-foreground">
            Automatically create a skill tree from your GitHub profile
          </p>
        </div>

        {/* No GitHub connected */}
        {!hasGithub && step === 'check' && (
          <div className="card p-6 text-center space-y-4">
            <Github className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold mb-1">GitHub not connected</h3>
              <p className="text-sm text-muted-foreground">
                Connect your GitHub account to analyze your repositories and generate a skill tree.
              </p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              Connect GitHub
            </a>
          </div>
        )}

        {/* Progress steps */}
        {hasGithub && step !== 'error' && (
          <div className="card p-6 space-y-6">
            {steps.map((s, i) => {
              const isActive = i === stepIndex;
              const isCompleted = i < stepIndex;

              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : isActive ? (
                      step === 'done' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      )
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-border" />
                    )}
                  </div>
                  <span
                    className={
                      isActive
                        ? 'font-medium text-foreground'
                        : isCompleted
                          ? 'text-muted-foreground'
                          : 'text-muted'
                    }
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}

            {step === 'done' && result && (
              <button
                onClick={() => router.push(`/editor/${result.graphId}`)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Open Skill Tree
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Error state */}
        {step === 'error' && (
          <div className="card p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400" />
            <div>
              <h3 className="font-semibold mb-1">Generation failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/dashboard')} className="btn-ghost">
                Back to Dashboard
              </button>
              <button onClick={() => startGeneration()} className="btn-primary">
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
