'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{
        user: {
          id: string;
          email: string;
          username: string;
          displayName?: string;
          avatarUrl?: string;
          onboardingCompleted: boolean;
        };
        token: string;
      }>('/auth/register', form);
      setAuth(res.user, res.token);
      router.push('/onboarding');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Link href="/" className="text-2xl font-bold text-gradient">
          Skillgraph
        </Link>
        <h1 className="text-2xl font-bold mt-8 mb-2">Create your account</h1>
        <p className="text-muted-foreground text-sm">Start building your skill tree today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="signup-displayname"
            className="block text-sm font-medium mb-1.5 text-muted-foreground"
          >
            Display Name
          </label>
          <input
            id="signup-displayname"
            type="text"
            value={form.displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
            autoComplete="name"
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base sm:text-sm text-foreground transition-colors"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label
            htmlFor="signup-username"
            className="block text-sm font-medium mb-1.5 text-muted-foreground"
          >
            Username
          </label>
          <input
            id="signup-username"
            type="text"
            value={form.username}
            onChange={(e) => updateField('username', e.target.value)}
            required
            autoComplete="username"
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base sm:text-sm text-foreground transition-colors"
            placeholder="johndoe"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium mb-1.5 text-muted-foreground"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base sm:text-sm text-foreground transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium mb-1.5 text-muted-foreground"
          >
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-base sm:text-sm text-foreground transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary hover:bg-primary-600 text-white font-medium text-sm transition-colors disabled:opacity-50 min-h-[48px] active:scale-[0.98]"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <a
        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/github`}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#24292f] hover:bg-[#32383f] text-white font-medium text-sm transition-colors min-h-[48px] active:scale-[0.98]"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        Continue with GitHub
      </a>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary-400 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
