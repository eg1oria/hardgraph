'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface SkillEntry {
  name: string;
  level: string;
  category: string;
  categoryColor: string;
}

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const FIELDS = [
  'frontend',
  'backend',
  'fullstack',
  'devops',
  'mobile',
  'data',
  'design',
  'product',
];
const CATEGORY_PRESETS = [
  { name: 'Languages', color: '#8B5CF6' },
  { name: 'Frameworks', color: '#3B82F6' },
  { name: 'Tools', color: '#F59E0B' },
  { name: 'Databases', color: '#10B981' },
  { name: 'DevOps', color: '#EF4444' },
  { name: 'Soft Skills', color: '#EC4899' },
];

export default function NewVacancyPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [field, setField] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // New skill form
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillColor, setNewSkillColor] = useState('#6B7280');

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      toast('Skill already added', 'error');
      return;
    }
    setSkills([
      ...skills,
      {
        name: newSkillName.trim(),
        level: newSkillLevel,
        category: newSkillCategory || 'General',
        categoryColor: newSkillColor,
      },
    ]);
    setNewSkillName('');
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || skills.length === 0) {
      toast('Title and at least one skill are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const vacancy = await api.post<{ id: string }>('/vacancies', {
        title: title.trim(),
        company: company.trim() || undefined,
        description: description.trim() || undefined,
        field: field || undefined,
        location: location.trim() || undefined,
        salaryRange: salaryRange.trim() || undefined,
        skills,
      });
      toast('Vacancy created', 'success');
      router.push(`/vacancies/${vacancy.id}`);
    } catch {
      toast('Failed to create vacancy', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/vacancies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Vacancies
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Briefcase className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Post a Vacancy</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Basic Information
          </h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              className="input-field"
              maxLength={200}
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Inc."
                className="input-field"
                maxLength={200}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Field</label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="input-field"
              >
                <option value="">Select field</option>
                {FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote / NYC"
                className="input-field"
                maxLength={200}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Salary Range</label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="e.g. $80k-$120k"
                className="input-field"
                maxLength={100}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements..."
              className="input-field resize-none"
              rows={4}
              maxLength={5000}
            />
          </div>
        </div>

        {/* Skills */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Required Skills *
          </h2>
          <p className="text-xs text-muted-foreground">
            Add the skills and minimum proficiency levels required for this position.
          </p>

          {/* Add skill form */}
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Skill Name</label>
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="e.g. React"
                className="input-field text-sm"
                maxLength={150}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-muted-foreground mb-1 block">Level</label>
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                className="input-field text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select
                value={newSkillCategory}
                onChange={(e) => {
                  setNewSkillCategory(e.target.value);
                  const preset = CATEGORY_PRESETS.find((c) => c.name === e.target.value);
                  if (preset) setNewSkillColor(preset.color);
                }}
                className="input-field text-sm"
              >
                <option value="">General</option>
                {CATEGORY_PRESETS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={addSkill} className="btn-secondary text-sm shrink-0">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Skills list */}
          {skills.length > 0 && (
            <div className="space-y-2">
              {skills.map((skill, i) => (
                <div
                  key={`${skill.name}-${i}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-light"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: skill.categoryColor }}
                    />
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{skill.level}</span>
                    <span className="text-[10px] text-muted">{skill.category}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(i)}
                    className="text-muted hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <p className="text-xs text-muted">{skills.length} skills added</p>
            </div>
          )}

          {skills.length === 0 && (
            <div className="text-center py-4 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No skills added yet</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/vacancies" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating...' : 'Post Vacancy'}
          </button>
        </div>
      </form>
    </div>
  );
}
