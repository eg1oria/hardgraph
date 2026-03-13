'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

type VerifyState = 'loading' | 'success' | 'error';

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const didVerify = useRef(false);
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMsg('No verification token provided.');
      return;
    }

    if (didVerify.current) return;
    didVerify.current = true;

    api
      .get<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        // Update store so guards know email is verified
        if (user) {
          setUser({ ...user, emailVerified: true });
        }
        setState('success');

        // Auto-redirect if user is already logged in
        const authToken = getToken();
        if (authToken) {
          setTimeout(() => {
            router.replace(user?.onboardingCompleted ? '/dashboard' : '/onboarding');
          }, 1500);
        }
      })
      .catch((err: unknown) => {
        setState('error');
        setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Link href="/" className="text-2xl font-bold text-gradient">
          HardGraph
        </Link>
      </div>

      {state === 'loading' && (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying your email...</p>
        </div>
      )}

      {state === 'success' && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Email verified!</h1>
            <p className="text-muted-foreground text-sm">
              {getToken()
                ? 'Redirecting to your dashboard...'
                : 'Your email has been verified. You can now use all features.'}
            </p>
          </div>
          {!getToken() && (
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-lg bg-primary hover:bg-primary-600 text-white font-medium text-sm transition-colors text-center min-h-[48px]"
            >
              Continue to sign in
            </Link>
          )}
        </div>
      )}

      {state === 'error' && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Verification failed</h1>
            <p className="text-muted-foreground text-sm">{errorMsg}</p>
          </div>
          <div className="space-y-3">
            <Link
              href="/verify-email"
              className="inline-block w-full py-3 rounded-lg bg-primary hover:bg-primary-600 text-white font-medium text-sm transition-colors text-center min-h-[48px]"
            >
              Request a new link
            </Link>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-lg bg-surface border border-border hover:bg-surface/80 text-foreground font-medium text-sm transition-colors text-center min-h-[48px]"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
