'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

export function useAuthGuard() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
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
      }>('/users/me')
      .then((me) => {
        setAuth(me, token);
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, [router, user, isAuthenticated, setAuth, logout]);

  return { loading, user, isAuthenticated };
}
