'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import type { VacancyDetail, ApplicationStatus } from './_components/types';
import { VacancyHeader } from './_components/VacancyHeader';
import { VacancyDetailsTab } from './_components/VacancyDetailsTab';
import { VacancyCompareTab } from './_components/VacancyCompareTab';
import { ApplyModal } from './_components/ApplyModal';

export default function VacancyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'details' | 'compare'>('details');

  // Application state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(false);

  const vacancyId = params.id;
  const isOwner = user?.id === vacancy?.authorId;

  const loadVacancy = useCallback(() => {
    api
      .get<VacancyDetail>(`/vacancies/${vacancyId}`)
      .then(setVacancy)
      .catch(() => toast('Failed to load vacancy', 'error'))
      .finally(() => setLoading(false));
  }, [vacancyId, toast]);

  useEffect(() => {
    loadVacancy();
  }, [loadVacancy]);

  // Check if user already applied (skip for owners)
  useEffect(() => {
    if (!user || !vacancyId || !vacancy || vacancy.authorId === user.id) return;
    setCheckingApplication(true);
    api
      .get<ApplicationStatus | null>(`/vacancies/${vacancyId}/applications/check`)
      .then((res) => setApplicationStatus(res))
      .catch(() => toast('Failed to check application status', 'error'))
      .finally(() => setCheckingApplication(false));
  }, [user, vacancyId, vacancy, toast]);

  const handleDelete = async () => {
    if (!confirm('Delete this vacancy?')) return;
    try {
      await api.delete(`/vacancies/${vacancyId}`);
      toast('Vacancy deleted', 'success');
      router.push('/vacancies');
    } catch {
      toast('Failed to delete vacancy', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="mb-3">Vacancy not found</p>
        <Link href="/vacancies" className="text-sm text-primary hover:underline">
          Back to vacancies
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/vacancies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Vacancies
      </Link>

      <VacancyHeader vacancy={vacancy} isOwner={isOwner} onDelete={handleDelete} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab('details')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'details'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setTab('compare')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'compare'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {isOwner ? 'Compare & Applications' : 'Compare'}
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'details' && (
        <VacancyDetailsTab
          vacancy={vacancy}
          isOwner={isOwner}
          user={user}
          checkingApplication={checkingApplication}
          applicationStatus={applicationStatus}
          onApply={() => setShowApplyModal(true)}
        />
      )}

      {tab === 'compare' && <VacancyCompareTab vacancyId={vacancyId} isOwner={isOwner} />}

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyModal
          vacancy={vacancy}
          onClose={() => setShowApplyModal(false)}
          onApplied={(result) => {
            setApplicationStatus({ id: result.id, status: result.status });
            setShowApplyModal(false);
          }}
        />
      )}
    </div>
  );
}
