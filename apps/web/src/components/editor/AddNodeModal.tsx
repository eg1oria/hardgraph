'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useGraphStore } from '@/stores/useGraphStore';
import { SKILL_LEVELS, NODE_COLORS } from '@/lib/constants';

interface AddNodeModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    description: string;
    level: string;
    icon: string;
    categoryId: string;
  }) => void;
}

export function AddNodeModal({ open, onClose, onAdd }: AddNodeModalProps) {
  const categories = useGraphStore((s) => s.categories);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('beginner');

  const [categoryId, setCategoryId] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), description, level, icon: '', categoryId });
    setName('');
    setDescription('');
    setLevel('beginner');
    setCategoryId('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Node">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Name *</label>
          <input
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. React, Figma, SEO, Photography"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Description</label>
          <textarea
            className="input-field resize-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Level</label>
          <div className="grid grid-cols-2 gap-1.5">
            {SKILL_LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  level === l
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface-light text-muted-foreground hover:border-primary/30'
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                  style={{ backgroundColor: NODE_COLORS[l] }}
                />
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Category</label>
            <select
              className="input-field"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={!name.trim()}
          >
            Add Node
          </button>
        </div>
      </div>
    </Modal>
  );
}
