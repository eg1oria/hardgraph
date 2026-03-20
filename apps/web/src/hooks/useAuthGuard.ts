'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

export function useAuthGuard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(true);
  const didFetch = useRef(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace('/login');
      setLoading(false);
      return;
    }

    if (isAuthenticated && user) {
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches in StrictMode
    if (didFetch.current) return;
    didFetch.current = true;

    const controller = new AbortController();

    // Try to restore session from stored token
    api
      .get<{
        id: string;
        email: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
        emailVerified: boolean;
        onboardingCompleted: boolean;
      }>('/users/me', controller.signal)
      .then((me) => {
        if (!controller.signal.aborted) {
          setAuth(me, token);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          // Only logout on auth errors (401/403), not on network failures
          // Note: 401 is already handled globally in api.ts, but we cover 403 here too
          if (err?.statusCode === 401 || err?.statusCode === 403) {
            logout();
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [router, user, isAuthenticated, setAuth, logout]);

  return { loading, user, isAuthenticated };
}
