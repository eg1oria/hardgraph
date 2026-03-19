'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Star, BookTemplate } from 'lucide-react';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

interface Template {
  id: string;
  name: string;
  description: string | null;
  field: string | null;
  isFeatured: boolean;
  usageCount: number;
  skillCount: number;
}

interface TargetSelectorProps {
  selectedId: string | null;
  onSelect: (templateId: string) => void;
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

export function TargetSelector({ selectedId, onSelect }: TargetSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');

  useEffect(() => {
    api
      .get<Template[]>('/gap-analysis/targets')
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
      const matchesField =
        !fieldFilter || (t.field && t.field.toLowerCase() === fieldFilter.toLowerCase());
      return matchesSearch && matchesField;
    });
  }, [templates, search, fieldFilter]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search templates..."
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

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-8">
          <BookTemplate className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
          <p className="text-sm text-muted-foreground">
            No templates found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((template) => {
            const isSelected = selectedId === template.id;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template.id)}
                className={`card text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary/50'
                    : 'hover:border-border-light cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium">{template.name}</h4>
                  {template.isFeatured && (
                    <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                  )}
                </div>
                {template.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {template.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-auto">
                  {template.field && <Badge variant="muted">{template.field}</Badge>}
                  <span className="text-[11px] text-muted">{template.skillCount} skills</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
