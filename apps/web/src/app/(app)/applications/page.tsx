'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Building2, MapPin, Trash2, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

interface MyApplication {
  id: string;
  vacancyId: string;
  graphId: string;
  coverLetter: string | null;
  status: string;
  matchScore: number;
  matchedSkills: number;
  totalRequired: number;
  createdAt: string;
  vacancy: {
    id: string;
    title: string;
    company: string | null;
    field: string | null;
    location: string | null;
    isActive: boolean;
    author: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  };
  graph: {
    id: string;
    title: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  reviewing: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  shortlisted: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  rejected: 'bg-red-500/15 text-red-500 border-red-500/30',
  accepted: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
};

function getScoreColor(score: number) {
  if (score >= 76) return 'text-emerald-400';
  if (score >= 51) return 'text-yellow-400';
  if (score >= 26) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number) {
  if (score >= 76) return 'bg-emerald-500';
  if (score >= 51) return 'bg-yellow-500';
  if (score >= 26) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function MyApplicationsPage() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<MyApplication[]>('/applications/mine')
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch(() => {
        if (!cancelled) toast('Failed to load applications', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleWithdraw = async (app: MyApplication) => {
    if (!confirm('Withdraw this application?')) return;
    setWithdrawingId(app.id);
    try {
      await api.delete(`/vacancies/${app.vacancyId}/applications/${app.id}`);
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      toast('Application withdrawn', 'success');
    } catch {
      toast('Failed to withdraw application', 'error');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/vacancies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Vacancies
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold mb-6">My Applications</h1>

      {applications.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted-foreground mb-3">
            You haven&apos;t applied to any vacancies yet.
          </p>
          <Link href="/vacancies" className="btn-primary text-sm">
            Browse Vacancies
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="card transition-all duration-300 hover:border-border-light"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/vacancies/${app.vacancy.id}`}
                    className="text-sm font-semibold hover:text-primary transition-colors"
                  >
                    {app.vacancy.title}
                  </Link>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    {app.vacancy.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {app.vacancy.company}
                      </span>
                    )}
                    {app.vacancy.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {app.vacancy.location}
                      </span>
                    )}
                    {app.vacancy.field && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {app.vacancy.field}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Applied with: {app.graph.title} &middot;{' '}
                    {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Match Score */}
                  <div className="flex items-center gap-2 w-28">
                    <div className="flex-1 h-2 rounded-full bg-surface-light overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getScoreBgColor(app.matchScore)}`}
                        style={{ width: `${app.matchScore}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-bold w-10 text-right ${getScoreColor(app.matchScore)}`}
                    >
                      {app.matchScore}%
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-medium px-2 py-1 rounded-full border capitalize ${STATUS_COLORS[app.status] ?? ''}`}
                  >
                    {app.status}
                  </span>

                  {/* Withdraw */}
                  {app.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(app)}
                      disabled={withdrawingId === app.id}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Withdraw application"
                    >
                      {withdrawingId === app.id ? (
                        <Spinner size="sm" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
