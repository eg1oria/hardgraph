'use client';

import { CreditCard, Zap, Check } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';

const FREE_FEATURES = [
  'Up to 3 skill graphs',
  'Unlimited nodes per graph',
  'Public profile page',
  'Share links',
  'Community templates',
];

const PRO_FEATURES = [
  'Unlimited skill graphs',
  'Custom themes & colors',
  'Analytics dashboard',
  'Priority support',
  'OG image generation',
  'Export to PDF / PNG',
];

export default function BillingPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <BackButton />
        <h1 className="text-2xl font-bold">Billing</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">Manage your subscription and plan</p>

      {/* Current plan */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">Free</p>
            </div>
          </div>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary-400">
            Active
          </span>
        </div>
      </div>

      {/* Plans comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Free */}
        <div className="card border-primary/20">
          <h3 className="font-semibold mb-1">Free</h3>
          <p className="text-2xl font-bold mb-4">
            $0<span className="text-sm font-normal text-muted-foreground">/month</span>
          </p>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button disabled className="btn-secondary w-full mt-6 opacity-60">
            Current Plan
          </button>
        </div>

        {/* Pro */}
        <div className="card border-primary/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-xs font-medium rounded-bl-lg">
            Coming Soon
          </div>
          <h3 className="font-semibold mb-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            Pro
          </h3>
          <p className="text-2xl font-bold mb-4">
            $9<span className="text-sm font-normal text-muted-foreground">/month</span>
          </p>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <button disabled className="btn-primary w-full mt-6 opacity-60">
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
