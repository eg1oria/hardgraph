'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

export function useAuthGuard() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

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

    // Try to restore session from stored token
    api
      .get<{
        id: string;
        email: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
        onboardingCompleted: boolean;
      }>('/users/me')
      .then((res) => {
        setAuth(res.data, token);
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, [router, user, isAuthenticated, setAuth, logout]);

  return { loading, user, isAuthenticated };
}
