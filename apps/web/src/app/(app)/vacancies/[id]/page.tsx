'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Trash2,
  Edit3,
  Search,
  Network,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Send,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';

interface VacancyDetail {
  id: string;
  authorId: string;
  title: string;
  company: string | null;
  description: string | null;
  field: string | null;
  location: string | null;
  salaryRange: string | null;
  skills: { name: string; level: string; category?: string; categoryColor?: string }[];
  isActive: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface PublicGraph {
  id: string;
  title: string;
  slug: string;
  field: string | null;
  user: { username: string; displayName: string | null; avatarUrl: string | null };
  _count: { nodes: number };
}

interface CompareResult {
  vacancyId: string;
  vacancyTitle: string;
  graphId: string;
  graphTitle: string;
  candidateUsername: string;
  candidateDisplayName: string | null;
  candidateAvatarUrl: string | null;
  matchScore: number;
  totalRequired: number;
  matchedCount: number;
  upgradeCount: number;
  missingCount: number;
  bonusCount: number;
  skills: {
    name: string;
    category?: string;
    categoryColor?: string;
    candidateLevel: string | null;
    requiredLevel: string;
    status: 'matched' | 'upgrade' | 'missing';
  }[];
  bonusSkills: { name: string; level: string; category?: string }[];
  categoryBreakdown: {
    name: string;
    color: string;
    matchScore: number;
    matched: number;
    total: number;
  }[];
}

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

interface MyGraph {
  id: string;
  title: string;
  isPublic: boolean;
  _count: { nodes: number };
}

interface ApplicationStatus {
  id: string;
  status: string;
}

function LevelDots({
  candidateLevel,
  requiredLevel,
}: {
  candidateLevel: string | null;
  requiredLevel: string;
}) {
  const userIdx = candidateLevel ? LEVELS.indexOf(candidateLevel) : -1;
  const targetIdx = LEVELS.indexOf(requiredLevel);

  return (
    <div className="flex items-center gap-1">
      {LEVELS.map((level, i) => {
        const isUser = i <= userIdx;
        const isTarget = i <= targetIdx;
        let bg = 'bg-surface-light';
        if (isUser && isTarget) bg = 'bg-emerald-500';
        else if (isUser) bg = 'bg-cyan-500/50';
        else if (isTarget) bg = 'bg-red-500/40';

        return <div key={level} className={`w-2 h-2 rounded-full ${bg}`} title={level} />;
      })}
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

export default function VacancyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Comparison state
  const [tab, setTab] = useState<'details' | 'compare' | 'applications'>('details');
  const [graphSearch, setGraphSearch] = useState('');
  const [publicGraphs, setPublicGraphs] = useState<PublicGraph[]>([]);
  const [loadingGraphs, setLoadingGraphs] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [comparing, setComparing] = useState(false);

  // Application state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [myGraphs, setMyGraphs] = useState<MyGraph[]>([]);
  const [loadingMyGraphs, setLoadingMyGraphs] = useState(false);
  const [selectedGraphId, setSelectedGraphId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(false);

  const vacancyId = params.id;
  const isOwner = user?.id === vacancy?.authorId;

  const loadVacancy = useCallback(() => {
    api
      .get<VacancyDetail>(`/vacancies/${vacancyId}`)
      .then(setVacancy)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vacancyId]);

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
      .catch(() => {})
      .finally(() => setCheckingApplication(false));
  }, [user, vacancyId, vacancy]);

  const searchGraphs = useCallback(async () => {
    setLoadingGraphs(true);
    try {
      const graphs = await api.get<PublicGraph[]>('/graphs/explore?limit=50');
      setPublicGraphs(graphs);
    } catch {
      toast('Failed to load graphs', 'error');
    } finally {
      setLoadingGraphs(false);
    }
  }, [toast]);

  useEffect(() => {
    if (tab === 'compare' && publicGraphs.length === 0) {
      searchGraphs();
    }
  }, [tab, publicGraphs.length, searchGraphs]);

  const filteredGraphs = publicGraphs.filter((g) => {
    if (!graphSearch) return true;
    const q = graphSearch.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.user.username.toLowerCase().includes(q) ||
      g.user.displayName?.toLowerCase().includes(q) ||
      g.field?.toLowerCase().includes(q)
    );
  });

  const handleCompare = async (graphId: string) => {
    setComparing(true);
    try {
      const result = await api.get<CompareResult>(`/vacancies/${vacancyId}/compare/${graphId}`);
      setCompareResult(result);
    } catch {
      toast('Failed to compare', 'error');
    } finally {
      setComparing(false);
    }
  };

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

  const openApplyModal = async () => {
    setShowApplyModal(true);
    if (myGraphs.length === 0) {
      setLoadingMyGraphs(true);
      try {
        const graphs = await api.get<MyGraph[]>('/graphs');
        setMyGraphs(graphs);
        if (graphs.length > 0 && graphs[0]) setSelectedGraphId(graphs[0].id);
      } catch {
        toast('Failed to load your graphs', 'error');
      } finally {
        setLoadingMyGraphs(false);
      }
    }
  };

  const handleApply = async () => {
    if (!selectedGraphId) {
      toast('Please select a graph', 'error');
      return;
    }
    setApplying(true);
    try {
      const result = await api.post<{ id: string; status: string }>(
        `/vacancies/${vacancyId}/applications`,
        { graphId: selectedGraphId, coverLetter: coverLetter || undefined },
      );
      setApplicationStatus({ id: result.id, status: result.status });
      setShowApplyModal(false);
      setCoverLetter('');
      toast('Application submitted successfully!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to apply';
      toast(message, 'error');
    } finally {
      setApplying(false);
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

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">{vacancy.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {vacancy.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> {vacancy.company}
                </span>
              )}
              {vacancy.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {vacancy.location}
                </span>
              )}
              {vacancy.salaryRange && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <DollarSign className="w-3.5 h-3.5" /> {vacancy.salaryRange}
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/vacancies/${vacancy.id}/edit`}
                className="p-2 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {vacancy.field && <Badge variant="muted">{vacancy.field}</Badge>}
          <Badge variant={vacancy.isActive ? 'primary' : 'muted'}>
            {vacancy.isActive ? 'Active' : 'Closed'}
          </Badge>
          <span className="text-xs text-muted">
            Posted by {vacancy.author.displayName || vacancy.author.username}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => {
            setTab('details');
            setCompareResult(null);
          }}
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
          Compare with Graphs
        </button>
        {isOwner && (
          <button
            onClick={() => setTab('applications')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              tab === 'applications'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Applications
          </button>
        )}
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {vacancy.description && (
              <div className="card">
                <h3 className="text-sm font-semibold mb-3">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {vacancy.description}
                </p>
              </div>
            )}
            {/* Apply Button */}
            {user && !isOwner && !checkingApplication && (
              <div className="card">
                {applicationStatus ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">Applied</p>
                      <p className="text-xs text-muted-foreground">
                        Status:{' '}
                        <span
                          className={`font-medium ${
                            applicationStatus.status === 'accepted'
                              ? 'text-emerald-500'
                              : applicationStatus.status === 'rejected'
                                ? 'text-red-500'
                                : applicationStatus.status === 'shortlisted'
                                  ? 'text-purple-500'
                                  : applicationStatus.status === 'reviewing'
                                    ? 'text-blue-500'
                                    : 'text-amber-500'
                          }`}
                        >
                          {applicationStatus.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={openApplyModal}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Apply with my Graph
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                Required Skills ({vacancy.skills.length})
              </h3>
              <div className="space-y-2">
                {vacancy.skills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: skill.categoryColor || '#6B7280' }}
                      />
                      <span className="text-sm font-medium">{skill.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{skill.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {tab === 'compare' && !compareResult && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a candidate&apos;s skill graph to compare against this vacancy&apos;s
            requirements.
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search graphs by title or username..."
              value={graphSearch}
              onChange={(e) => setGraphSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {loadingGraphs && (
            <div className="flex justify-center py-8">
              <Spinner size="md" className="text-primary" />
            </div>
          )}

          {!loadingGraphs && filteredGraphs.length === 0 && (
            <div className="card text-center py-8">
              <Network className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
              <p className="text-sm text-muted-foreground">No public graphs found.</p>
            </div>
          )}

          {!loadingGraphs && filteredGraphs.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredGraphs.map((graph) => (
                <button
                  key={graph.id}
                  onClick={() => handleCompare(graph.id)}
                  disabled={comparing}
                  className="card text-left hover:border-border-light transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar
                      src={graph.user.avatarUrl ?? undefined}
                      fallback={graph.user.displayName || graph.user.username}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {graph.user.displayName || graph.user.username}
                      </p>
                      <p className="text-xs text-muted">@{graph.user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Network className="w-3.5 h-3.5 text-primary shrink-0" />
                    <p className="text-sm font-medium truncate">{graph.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{graph._count.nodes} skills</span>
                    {graph.field && <Badge variant="muted">{graph.field}</Badge>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {comparing && (
            <div className="fixed inset-0 bg-background/60 flex items-center justify-center z-50">
              <div className="card flex items-center gap-3">
                <Spinner size="md" className="text-primary" />
                <span className="text-sm">Comparing skills...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compare Result */}
      {tab === 'compare' && compareResult && (
        <div className="space-y-6">
          <button
            onClick={() => setCompareResult(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to graph selection
          </button>

          {/* Score + Candidate */}
          <div className="card flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <p className={`text-5xl font-bold ${getScoreColor(compareResult.matchScore)}`}>
                {compareResult.matchScore}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Match Score</p>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                <Avatar
                  src={compareResult.candidateAvatarUrl ?? undefined}
                  fallback={compareResult.candidateDisplayName || compareResult.candidateUsername}
                  size="md"
                />
                <div>
                  <p className="font-semibold">
                    {compareResult.candidateDisplayName || compareResult.candidateUsername}
                  </p>
                  <p className="text-xs text-muted">@{compareResult.candidateUsername}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{compareResult.graphTitle}</span> &mdash;{' '}
                {compareResult.totalRequired} skills required &middot; {compareResult.matchedCount}{' '}
                matched &middot; {compareResult.upgradeCount} partial &middot;{' '}
                {compareResult.missingCount} missing
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card border-emerald-500/20 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-2xl font-bold text-emerald-500">{compareResult.matchedCount}</p>
              <p className="text-xs text-muted-foreground">Matched</p>
            </div>
            <div className="card border-amber-500/20 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold text-amber-500">{compareResult.upgradeCount}</p>
              <p className="text-xs text-muted-foreground">Partial</p>
            </div>
            <div className="card border-red-500/20 text-center">
              <XCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold text-red-500">{compareResult.missingCount}</p>
              <p className="text-xs text-muted-foreground">Missing</p>
            </div>
            <div className="card border-cyan-500/20 text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
              <p className="text-2xl font-bold text-cyan-500">{compareResult.bonusCount}</p>
              <p className="text-xs text-muted-foreground">Bonus</p>
            </div>
          </div>

          {/* Category Breakdown */}
          {compareResult.categoryBreakdown.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {compareResult.categoryBreakdown.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: cat.color }}>
                        {cat.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cat.matched}/{cat.total} &middot; {cat.matchScore}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-light overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          backgroundColor: cat.color,
                          width: `${cat.matchScore}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Detail */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Skills Detail</h3>
            <div className="space-y-2">
              {compareResult.skills.map((skill) => {
                const statusConfig = {
                  matched: {
                    border: 'border-l-emerald-500',
                    badge: 'bg-emerald-500/15 text-emerald-400',
                    label: 'Matched',
                  },
                  upgrade: {
                    border: 'border-l-amber-500',
                    badge: 'bg-amber-500/15 text-amber-400',
                    label: 'Partial',
                  },
                  missing: {
                    border: 'border-l-red-500',
                    badge: 'bg-red-500/15 text-red-400',
                    label: 'Missing',
                  },
                }[skill.status];

                return (
                  <div
                    key={skill.name}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg bg-surface-light border-l-2 ${statusConfig.border}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium truncate">{skill.name}</span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${statusConfig.badge}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground capitalize">
                        {skill.candidateLevel ?? 'none'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted" />
                      <span className="text-xs font-medium capitalize">{skill.requiredLevel}</span>
                      <LevelDots
                        candidateLevel={skill.candidateLevel}
                        requiredLevel={skill.requiredLevel}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bonus Skills */}
          {compareResult.bonusSkills.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Bonus Skills</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Additional skills this candidate has beyond the requirements.
              </p>
              <div className="flex flex-wrap gap-2">
                {compareResult.bonusSkills.map((skill) => (
                  <span
                    key={skill.name}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                  >
                    {skill.name}
                    <span className="ml-1 opacity-60">({skill.level})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applications Tab (Owner Only) */}
      {tab === 'applications' && isOwner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage applications for this vacancy</p>
            <Link
              href={`/vacancies/${vacancy.id}/applications`}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> View All Applications
            </Link>
          </div>
          <div className="card text-center py-8">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
            <p className="text-sm text-muted-foreground mb-3">
              View and manage all applications from the dedicated page.
            </p>
            <div className="flex justify-center gap-3">
              <Link href={`/vacancies/${vacancy.id}/applications`} className="btn-primary text-sm">
                Applications Dashboard
              </Link>
              <Link
                href="/vacancies/analytics"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                HR Analytics
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Apply to {vacancy.title}</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingMyGraphs ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" className="text-primary" />
              </div>
            ) : myGraphs.length === 0 ? (
              <div className="text-center py-8">
                <Network className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
                <p className="text-sm text-muted-foreground mb-3">
                  You don&apos;t have any graphs yet. Create one first!
                </p>
                <Link href="/dashboard" className="btn-primary text-sm">
                  Create Graph
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Your Graph</label>
                  <select
                    value={selectedGraphId}
                    onChange={(e) => setSelectedGraphId(e.target.value)}
                    className="input-field w-full"
                  >
                    {myGraphs.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title} ({g._count.nodes} skills)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cover Letter <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Tell the employer why you're a great fit..."
                    className="input-field w-full resize-none"
                  />
                  <p className="text-xs text-muted mt-1">{coverLetter.length}/2000</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-light transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={applying || !selectedGraphId}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {applying ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Application
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
