'use client';

import { motion } from 'framer-motion';
import { ScanForm } from '@/components/scan/ScanForm';
import { Github } from 'lucide-react';
import Link from 'next/link';

export default function ScanPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        {/* Logo / icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="rounded-2xl bg-surface/80 backdrop-blur-xl border border-border p-4">
            <Github className="w-10 h-10 text-foreground" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
        >
          <span className="text-gradient">GitHub Skill Scan</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg text-muted-foreground mb-10 max-w-md mx-auto"
        >
          Discover your tech skills from your GitHub profile. No signup required.
        </motion.p>

        {/* Form */}
        <ScanForm />

        {/* Example suggestions */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-sm text-muted"
        >
          Try:{' '}
          {['torvalds', 'gaearon', 'sindresorhus'].map((name, i) => (
            <span key={name}>
              {i > 0 && ', '}
              <Link
                href={`/scan/${name}`}
                className="text-primary hover:underline transition-colors"
              >
                {name}
              </Link>
            </span>
          ))}
        </motion.p>
      </div>

      {/* Back to home */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8"
      >
        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Back to HardGraph
        </Link>
      </motion.div>
    </main>
  );
}
