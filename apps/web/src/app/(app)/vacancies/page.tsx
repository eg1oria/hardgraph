'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';

interface Vacancy {
  id: string;
  title: string;
  company: string | null;
  description: string | null;
  field: string | null;
  location: string | null;
  salaryRange: string | null;
  skills: { name: string; level: string; category?: string }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface PaginatedResponse {
  data: Vacancy[];
  total: number;
  page: number;
  totalPages: number;
}

const FIELD_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
  { label: 'Full Stack', value: 'fullstack' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Data', value: 'data' },
  { label: 'Design', value: 'design' },
  { label: 'Product', value: 'product' },
];

const PAGE_SIZE = 20;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function VacanciesPage() {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const loadVacancies = useCallback(
    (currentPage: number, currentSearch: string, currentField: string) => {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(PAGE_SIZE));
      if (currentSearch) params.set('search', currentSearch);
      if (currentField) params.set('field', currentField);

      api
        .get<PaginatedResponse>(`/vacancies?${params.toString()}`)
        .then((res) => {
          setVacancies(res.data);
          setTotalPages(res.totalPages);
          setTotal(res.total);
          setPage(res.page);
        })
        .catch(() => {
          setError(true);
          toast('Failed to load vacancies', 'error');
        })
        .finally(() => setLoading(false));
    },
    [toast],
  );

  useEffect(() => {
    loadVacancies(1, search, fieldFilter);
  }, []); // Load once on mount

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadVacancies(1, value, fieldFilter);
    }, 400);
  };

  const handleFieldChange = (value: string) => {
    setFieldFilter(value);
    setPage(1);
    loadVacancies(1, search, value);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadVacancies(newPage, search, fieldFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearch('');
    setFieldFilter('');
    setPage(1);
    loadVacancies(1, '', '');
  };

  // Build page numbers with ellipsis
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Vacancies</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Browse open positions and compare them against skill graphs.
          </p>
        </div>
        {user && (
          <Link href="/vacancies/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Post Vacancy
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search vacancies..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FIELD_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFieldChange(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                fieldFilter === f.value
                  ? 'bg-primary/15 text-primary-400'
                  : 'bg-surface-light text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count + Clear filters */}
      <div className="flex items-center justify-between mb-4">
        {!loading && !error && (
          <p className="text-xs text-muted-foreground">
            Showing {vacancies.length} of {total} vacancies
          </p>
        )}
        {!loading && <div />}
        {(search || fieldFilter) && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-2/3 bg-surface-light rounded mb-2" />
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-24 bg-surface-light rounded" />
                    <div className="h-3 w-20 bg-surface-light rounded" />
                    <div className="h-3 w-16 bg-surface-light rounded" />
                  </div>
                  <div className="h-4 w-full bg-surface-light rounded mb-1" />
                  <div className="h-4 w-3/4 bg-surface-light rounded mb-3" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-surface-light rounded-full" />
                    <div className="h-4 w-20 bg-surface-light rounded" />
                  </div>
                </div>
                <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px] justify-end">
                  <div className="h-5 w-14 bg-surface-light rounded-full" />
                  <div className="h-5 w-16 bg-surface-light rounded-full" />
                  <div className="h-5 w-12 bg-surface-light rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card text-center py-12">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-red-400 opacity-60" />
          <p className="text-sm text-muted-foreground mb-4">Failed to load vacancies.</p>
          <button
            onClick={() => loadVacancies(page, search, fieldFilter)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary-400 text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && vacancies.length === 0 && (
        <div className="card text-center py-12">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted-foreground mb-3">
            {search || fieldFilter
              ? 'No vacancies match your criteria.'
              : 'No vacancies posted yet.'}
          </p>
          {(search || fieldFilter) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary-400 text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Clear filters
            </button>
          )}
        </div>
      )}

      {/* Vacancy List */}
      {!loading && !error && vacancies.length > 0 && (
        <>
          <div className="space-y-3">
            {vacancies.map((vacancy) => (
              <Link
                key={vacancy.id}
                href={`/vacancies/${vacancy.id}`}
                className="card block hover:border-border-light transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold mb-1 truncate">{vacancy.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                      {vacancy.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {vacancy.company}
                        </span>
                      )}
                      {vacancy.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {vacancy.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(vacancy.createdAt)}
                      </span>
                      {vacancy.updatedAt !== vacancy.createdAt && (
                        <span className="text-muted text-[11px]">
                          Updated {timeAgo(vacancy.updatedAt)}
                        </span>
                      )}
                    </div>
                    {vacancy.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {vacancy.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {vacancy.field && <Badge variant="muted">{vacancy.field}</Badge>}
                      {vacancy.salaryRange && (
                        <span className="text-xs text-emerald-400 font-medium">
                          {vacancy.salaryRange}
                        </span>
                      )}
                      <span className="text-[11px] text-muted">
                        {vacancy.skills.length} skills required
                      </span>
                    </div>
                  </div>
                  {/* Skill preview */}
                  <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px] justify-end">
                    {vacancy.skills.slice(0, 4).map((s) => (
                      <span
                        key={s.name}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-light text-muted-foreground"
                      >
                        {s.name}
                      </span>
                    ))}
                    {vacancy.skills.length > 4 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] text-muted">
                        +{vacancy.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pages.map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-xs">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`min-w-[32px] h-8 rounded-md text-xs font-medium transition-colors ${
                        p === page
                          ? 'bg-primary/10 text-primary-400'
                          : 'hover:bg-surface-light text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-md hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
