'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, Clock, Eye, FileText, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

interface ApplicationItem {
  id: string;
  vacancyId: string;
  applicantId: string;
  graphId: string;
  coverLetter: string | null;
  status: string;
  matchScore: number;
  matchedSkills: number;
  totalRequired: number;
  hrNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  applicant: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  graph: {
    id: string;
    title: string;
    slug: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  reviewing: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  shortlisted: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  rejected: 'bg-red-500/15 text-red-500 border-red-500/30',
  accepted: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
};

const STATUS_TABS = ['all', 'pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'];

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

export default function VacancyApplicationsPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const vacancyId = params.id;

  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'matchScore' | 'createdAt'>('matchScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hrNoteInputs, setHrNoteInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const fetchApplications = useCallback(
    (isInitial = false) => {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      api
        .get<ApplicationItem[]>(
          `/vacancies/${vacancyId}/applications?sort=${sortField}&order=${sortOrder}${statusParam}`,
        )
        .then((data) => {
          setApplications(data);
          // Pre-fill HR notes
          const notes: Record<string, string> = {};
          for (const a of data) {
            notes[a.id] = a.hrNote ?? '';
          }
          setHrNoteInputs(notes);
        })
        .catch(() => toast('Failed to load applications', 'error'))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [vacancyId, statusFilter, sortField, sortOrder, toast],
  );

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchApplications(true);
    } else {
      fetchApplications();
    }
  }, [fetchApplications]);

  const updateStatus = async (applicationId: string, status: string) => {
    setUpdatingId(applicationId);
    try {
      const updated = await api.patch<ApplicationItem>(
        `/vacancies/${vacancyId}/applications/${applicationId}`,
        { status, hrNote: hrNoteInputs[applicationId] || undefined },
      );
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, ...updated } : a)),
      );
      toast(`Status updated to ${status}`, 'success');
    } catch {
      toast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSort = (field: 'matchScore' | 'createdAt') => {
    if (sortField === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href={`/vacancies/${vacancyId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Vacancy
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Applications</h1>
        <div className="flex items-center gap-3">
          {refreshing && <Spinner size="sm" className="text-primary" />}
          <Link
            href={`/vacancies/${vacancyId}/analytics`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-2 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px ${
              statusFilter === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sort Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => toggleSort('matchScore')}
          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          Match Score
          {sortField === 'matchScore' &&
            (sortOrder === 'desc' ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            ))}
        </button>
        <button
          onClick={() => toggleSort('createdAt')}
          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          Date
          {sortField === 'createdAt' &&
            (sortOrder === 'desc' ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            ))}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      )}

      {!loading && applications.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted-foreground">No applications found.</p>
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div key={app.id} className="card transition-all duration-300">
                {/* Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="w-full flex items-center gap-4 text-left"
                >
                  <Avatar
                    src={app.applicant.avatarUrl ?? undefined}
                    fallback={app.applicant.displayName || app.applicant.username}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {app.applicant.displayName || app.applicant.username}
                    </p>
                    <p className="text-xs text-muted">@{app.applicant.username}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Match Score Bar */}
                    <div className="hidden sm:flex items-center gap-2 w-32">
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
                    <span
                      className={`text-[10px] font-medium px-2 py-1 rounded-full border capitalize ${STATUS_COLORS[app.status] ?? ''}`}
                    >
                      {app.status}
                    </span>
                    <span className="text-xs text-muted hidden sm:block">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted" />
                    )}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    {/* Score + Graph */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="text-center sm:text-left">
                        <p className={`text-4xl font-bold ${getScoreColor(app.matchScore)}`}>
                          {app.matchScore}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {app.matchedSkills}/{app.totalRequired} skills matched
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Graph:</span>{' '}
                          {app.graph.title}
                        </p>
                        {app.reviewedAt && (
                          <p className="text-xs text-muted mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Reviewed{' '}
                            {new Date(app.reviewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cover Letter */}
                    {app.coverLetter && (
                      <div>
                        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                          Cover Letter
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-surface-light rounded-lg p-3">
                          {app.coverLetter}
                        </p>
                      </div>
                    )}

                    {/* HR Note */}
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                        HR Note
                      </p>
                      <textarea
                        value={hrNoteInputs[app.id] ?? ''}
                        onChange={(e) =>
                          setHrNoteInputs((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        maxLength={1000}
                        rows={2}
                        placeholder="Add a note about this candidate..."
                        className="input-field w-full resize-none text-sm"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {app.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(app.id, 'reviewing')}
                          disabled={updatingId === app.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-500 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                        >
                          {updatingId === app.id ? <Spinner size="sm" /> : 'Start Review'}
                        </button>
                      )}
                      {(app.status === 'pending' || app.status === 'reviewing') && (
                        <button
                          onClick={() => updateStatus(app.id, 'shortlisted')}
                          disabled={updatingId === app.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-500 border border-purple-500/30 hover:bg-purple-500/25 transition-colors"
                        >
                          Shortlist
                        </button>
                      )}
                      {app.status !== 'accepted' && app.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(app.id, 'accepted')}
                          disabled={updatingId === app.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                        >
                          Accept
                        </button>
                      )}
                      {app.status !== 'rejected' && app.status !== 'accepted' && (
                        <button
                          onClick={() => updateStatus(app.id, 'rejected')}
                          disabled={updatingId === app.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/25 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      <Link
                        href={`/vacancies/${vacancyId}/compare/${app.graphId}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 hover:bg-cyan-500/25 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Comparison
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
