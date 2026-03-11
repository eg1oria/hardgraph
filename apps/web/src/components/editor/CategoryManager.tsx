'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useGraphStore } from '@/stores/useGraphStore';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const PRESET_COLORS = [
  '#6366F1',
  '#22D3EE',
  '#A855F7',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#EC4899',
  '#3B82F6',
];

export function CategoryManager() {
  const graphId = useGraphStore((s) => s.graphId);
  const categories = useGraphStore((s) => s.categories);
  const addCategory = useGraphStore((s) => s.addCategory);
  const removeCategory = useGraphStore((s) => s.removeCategory);
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const handleAdd = async () => {
    if (!newName.trim() || !graphId) return;
    try {
      const res = await api.post<{ id: string; name: string; color: string; sortOrder: number }>(
        `/graphs/${graphId}/categories`,
        { name: newName.trim(), color: newColor, sortOrder: categories.length },
      );
      addCategory(res.data);
      setNewName('');
      setNewColor(PRESET_COLORS[(categories.length + 1) % PRESET_COLORS.length]);
      setIsAdding(false);
    } catch {
      toast('Failed to create category', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      removeCategory(id);
    } catch {
      toast('Failed to delete category', 'error');
    }
  };

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-surface-light transition-colors group"
        >
          <div
            className="w-3 h-3 rounded-full shrink-0 border border-border"
            style={{ backgroundColor: cat.color ?? '#6366F1' }}
          />
          <span className="flex-1 truncate text-muted-foreground">{cat.name}</span>
          <button
            onClick={() => handleDelete(cat.id)}
            className="sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 p-2 rounded text-muted hover:text-red-400 active:text-red-400 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={`Delete ${cat.name} category`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {isAdding ? (
        <div className="space-y-2 p-2 rounded-lg bg-surface-light border border-border">
          <input
            className="input-field"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setIsAdding(false);
            }}
          />
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                aria-label={`Select color ${c}`}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  newColor === c
                    ? 'border-foreground scale-110'
                    : 'border-transparent hover:border-foreground/30'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setIsAdding(false)}
              className="btn-ghost !py-1 !px-2 !text-xs flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="btn-primary !py-1 !px-2 !text-xs flex-1"
              disabled={!newName.trim()}
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full btn-ghost !justify-start !px-2 !py-2 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add category
        </button>
      )}
    </div>
  );
}
