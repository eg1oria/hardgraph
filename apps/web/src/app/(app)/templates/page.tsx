'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

interface Template {
  id: string;
  name: string;
  description: string | null;
  field: string | null;
  usageCount: number;
  isFeatured: boolean;
  graphData: {
    nodes?: Array<Record<string, unknown>>;
    categories?: Array<Record<string, unknown>>;
  };
}

const FIELD_ICONS: Record<string, string> = {
  frontend: '⚛️',
  backend: '🚀',
  devops: '🐳',
  data: '🧠',
};

const FIELD_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  devops: 'DevOps',
  data: 'Data Science',
};

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingId, setUsingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Template[]>('/templates')
      .then((data) => setTemplates(data))
      .catch(() => toast('Failed to load templates', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleUse = useCallback(
    async (id: string) => {
      setUsingId(id);
      try {
        const res = await api.post<{ id: string }>(`/templates/${id}/use`);
        toast('Graph created from template!', 'success');
        router.push(`/editor/${res.id}`);
      } catch {
        toast('Failed to create graph', 'error');
      } finally {
        setUsingId(null);
      }
    },
    [router, toast],
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Templates</h1>
        <p className="text-muted-foreground text-sm">
          Choose a starter template and customize it to showcase your skills
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card space-y-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t) => {
            const nodeCount = t.graphData?.nodes?.length ?? 0;
            const catCount = t.graphData?.categories?.length ?? 0;
            return (
              <div key={t.id} className="card hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{FIELD_ICONS[t.field ?? ''] ?? '📋'}</div>
                  <div className="flex items-center gap-2">
                    {t.isFeatured && (
                      <Badge variant="accent" className="gap-1">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </Badge>
                    )}
                    {t.field && <Badge variant="muted">{FIELD_LABELS[t.field] ?? t.field}</Badge>}
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary-400 transition-colors">
                  {t.name}
                </h3>
                {t.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{t.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted mb-4">
                  <span>{nodeCount} nodes</span>
                  <span>{catCount} categories</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {t.usageCount} uses
                  </span>
                </div>

                <button
                  onClick={() => handleUse(t.id)}
                  disabled={usingId === t.id}
                  className="btn-primary w-full !text-sm"
                >
                  {usingId === t.id ? (
                    <>
                      <Spinner size="sm" /> Creating...
                    </>
                  ) : (
                    <>
                      Use Template
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
