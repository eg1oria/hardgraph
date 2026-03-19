'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Plus, Search, MapPin, Building2, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/useAuthStore';

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
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
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
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');

  useEffect(() => {
    api
      .get<Vacancy[]>('/vacancies')
      .then(setVacancies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return vacancies.filter((v) => {
      const matchesSearch =
        !search ||
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.company?.toLowerCase().includes(search.toLowerCase());
      const matchesField =
        !fieldFilter || (v.field && v.field.toLowerCase() === fieldFilter.toLowerCase());
      return matchesSearch && matchesField;
    });
  }, [vacancies, search, fieldFilter]);

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
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search vacancies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FIELD_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFieldFilter(f.value)}
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

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="card text-center py-12">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted-foreground">
            {search || fieldFilter
              ? 'No vacancies match your criteria.'
              : 'No vacancies posted yet.'}
          </p>
        </div>
      )}

      {/* Vacancy List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((vacancy) => (
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
      )}
    </div>
  );
}
