'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Star, StarOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { AdminModal, ConfirmModal } from '@/components/admin/AdminModal';

interface Template {
  id: string;
  name: string;
  description: string | null;
  field: string | null;
  graphData: Record<string, unknown>;
  usageCount: number;
  isFeatured: boolean;
  createdAt: string;
}

interface TemplateForm {
  name: string;
  description: string;
  field: string;
  graphData: string;
  isFeatured: boolean;
}

const emptyForm: TemplateForm = {
  name: '',
  description: '',
  field: '',
  graphData: '{}',
  isFeatured: false,
};

export default function AdminTemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Template[]>('/admin/templates');
      setTemplates(data);
    } catch {
      toast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setJsonError('');
    setShowForm(true);
  };

  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description ?? '',
      field: t.field ?? '',
      graphData: JSON.stringify(t.graphData, null, 2),
      isFeatured: t.isFeatured,
    });
    setJsonError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Name is required', 'error');
      return;
    }

    let parsedData: Record<string, unknown>;
    try {
      parsedData = JSON.parse(form.graphData);
    } catch {
      setJsonError('Invalid JSON');
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        field: form.field || undefined,
        graphData: parsedData,
        isFeatured: form.isFeatured,
      };

      if (editingId) {
        await api.patch(`/admin/templates/${editingId}`, body);
        toast('Template updated', 'success');
      } else {
        await api.post('/admin/templates', body);
        toast('Template created', 'success');
      }
      setShowForm(false);
      fetchTemplates();
    } catch {
      toast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/templates/${deleteTarget.id}`);
      toast('Template deleted', 'success');
      setDeleteTarget(null);
      fetchTemplates();
    } catch {
      toast('Failed to delete template', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFeatured = async (t: Template) => {
    setTogglingFeatured(t.id);
    try {
      await api.patch(`/admin/templates/${t.id}`, { isFeatured: !t.isFeatured });
      setTemplates((prev) =>
        prev.map((tpl) => (tpl.id === t.id ? { ...tpl, isFeatured: !tpl.isFeatured } : tpl)),
      );
      toast(`Template ${t.isFeatured ? 'unfeatured' : 'featured'}`, 'success');
    } catch {
      toast('Failed to update template', 'error');
    } finally {
      setTogglingFeatured(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-muted-foreground">{templates.length} total</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary-400 hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground text-center py-8">No templates yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{t.name}</h3>
                  {t.field && <p className="text-xs text-primary-400 mt-0.5">{t.field}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => handleToggleFeatured(t)}
                    disabled={togglingFeatured === t.id}
                    className={`p-1.5 rounded-md transition-colors ${
                      t.isFeatured
                        ? 'text-amber-400 hover:bg-amber-500/10'
                        : 'text-muted-foreground hover:bg-surface-light'
                    }`}
                    title={t.isFeatured ? 'Unfeature' : 'Feature'}
                  >
                    {t.isFeatured ? (
                      <Star className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <StarOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-primary-400 hover:bg-primary/10 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {t.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>{t.usageCount} uses</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <AdminModal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Template' : 'Create Template'}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-light transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary-400 hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              placeholder="Template name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Field</label>
            <input
              type="text"
              value={form.field}
              onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              placeholder="e.g. Frontend, Backend, DevOps"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Graph Data (JSON) *
            </label>
            <textarea
              value={form.graphData}
              onChange={(e) => {
                setForm((f) => ({ ...f, graphData: e.target.value }));
                setJsonError('');
              }}
              rows={8}
              className={`w-full px-3 py-2 rounded-lg border bg-surface text-sm text-foreground font-mono focus:outline-none focus:ring-1 resize-y ${
                jsonError
                  ? 'border-red-500/50 focus:ring-red-500/20'
                  : 'border-border focus:border-primary/50 focus:ring-primary/20'
              }`}
              placeholder="{}"
            />
            {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
              className="rounded border-border bg-surface text-primary focus:ring-primary/20"
            />
            <span className="text-sm">Featured template</span>
          </label>
        </div>
      </AdminModal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
