'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  useEffect(() => {
    // Support both legacy query param token and safer fragment token (not sent as Referer).
    const tokenFromQuery = searchParams.get('token');
    const tokenFromHash =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token')
        : null;
    const token = tokenFromHash || tokenFromQuery;
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setError(oauthError);
      return;
    }

    if (!token) {
      setError('Authentication failed — no token received');
      return;
    }

    // Store token first, then fetch user profile
    setToken(token);

    // If token arrived via fragment, clear it from the URL to reduce accidental sharing.
    try {
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      // ignore
    }

    api
      .get<{
        id: string;
        email: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
        githubUsername?: string;
        emailVerified: boolean;
        onboardingCompleted: boolean;
      }>('/users/me')
      .then((user) => {
        setAuth(user, token);
        if (!user.emailVerified) {
          router.replace('/verify-email');
        } else {
          router.replace(user.onboardingCompleted ? '/dashboard' : '/onboarding');
        }
      })
      .catch(() => {
        setError('Failed to load user profile');
      });
  }, [searchParams, setAuth, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-red-400 text-sm">{error}</p>
        <a href="/login" className="text-primary hover:text-primary-400 text-sm transition-colors">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Signing in with GitHub...</p>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      }
    >
      <GitHubCallbackContent />
    </Suspense>
  );
}
