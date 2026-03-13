'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';

export default function VerifyEmailPage() {
  const user = useAuthStore((s) => s.user);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!user?.email || cooldown > 0) return;
    setResending(true);
    setMessage('');

    try {
      await api.post('/auth/resend-verification', { email: user.email });
      setMessage('Verification email sent! Check your inbox.');
      setCooldown(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend';
      setMessage(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Link href="/" className="text-2xl font-bold text-gradient">
          HardGraph
        </Link>
        <h1 className="text-2xl font-bold mt-8 mb-2">Check your email</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          We sent a verification link to{' '}
          <span className="text-foreground font-medium">{user?.email || 'your email'}</span>. Click
          the link to activate your account.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-surface border border-border text-center">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or request a new link.
          </p>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm text-center">
            {message}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="w-full py-3 rounded-lg bg-primary hover:bg-primary-600 text-white font-medium text-sm transition-colors disabled:opacity-50 min-h-[48px] active:scale-[0.98]"
        >
          {resending
            ? 'Sending...'
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend verification email'}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Wrong email?{' '}
          <Link href="/signup" className="text-primary hover:text-primary-400 transition-colors">
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  );
}
