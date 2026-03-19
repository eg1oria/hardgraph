'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Briefcase,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface SkillEntry {
  name: string;
  level: string;
  category: string;
  categoryColor: string;
}

interface DraftData {
  title: string;
  company: string;
  description: string;
  field: string;
  location: string;
  salaryRange: string;
  skills: SkillEntry[];
}

const DRAFT_KEY = 'vacancy-draft';

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

interface QuickSkill {
  name: string;
  category: string;
  color: string;
  fields: string[]; // which fields this skill is primary for
}

const QUICK_ADD_SKILLS: QuickSkill[] = [
  // Frontend (12)
  { name: 'React', category: 'Frameworks', color: '#3B82F6', fields: ['frontend', 'fullstack'] },
  { name: 'Vue.js', category: 'Frameworks', color: '#3B82F6', fields: ['frontend', 'fullstack'] },
  { name: 'Angular', category: 'Frameworks', color: '#3B82F6', fields: ['frontend', 'fullstack'] },
  { name: 'Next.js', category: 'Frameworks', color: '#3B82F6', fields: ['frontend', 'fullstack'] },
  { name: 'Nuxt', category: 'Frameworks', color: '#3B82F6', fields: ['frontend'] },
  { name: 'Svelte', category: 'Frameworks', color: '#3B82F6', fields: ['frontend'] },
  { name: 'HTML', category: 'Languages', color: '#8B5CF6', fields: ['frontend'] },
  { name: 'CSS/SCSS', category: 'Languages', color: '#8B5CF6', fields: ['frontend', 'design'] },
  { name: 'Tailwind CSS', category: 'Frameworks', color: '#3B82F6', fields: ['frontend'] },
  { name: 'Webpack', category: 'Tools', color: '#F59E0B', fields: ['frontend'] },
  { name: 'Vite', category: 'Tools', color: '#F59E0B', fields: ['frontend'] },
  { name: 'Storybook', category: 'Tools', color: '#F59E0B', fields: ['frontend', 'design'] },
  // Backend (12)
  { name: 'Node.js', category: 'Frameworks', color: '#3B82F6', fields: ['backend', 'fullstack'] },
  { name: 'NestJS', category: 'Frameworks', color: '#3B82F6', fields: ['backend'] },
  { name: 'Express', category: 'Frameworks', color: '#3B82F6', fields: ['backend'] },
  { name: 'Fastify', category: 'Frameworks', color: '#3B82F6', fields: ['backend'] },
  { name: 'Django', category: 'Frameworks', color: '#3B82F6', fields: ['backend', 'data'] },
  { name: 'FastAPI', category: 'Frameworks', color: '#3B82F6', fields: ['backend', 'data'] },
  { name: 'Spring Boot', category: 'Frameworks', color: '#3B82F6', fields: ['backend'] },
  { name: 'Laravel', category: 'Frameworks', color: '#3B82F6', fields: ['backend'] },
  { name: 'Ruby on Rails', category: 'Frameworks', color: '#3B82F6', fields: ['backend'] },
  { name: 'ASP.NET', category: 'Frameworks', color: '#3B82F6', fields: ['backend'] },
  { name: 'gRPC', category: 'Tools', color: '#F59E0B', fields: ['backend'] },
  { name: 'RabbitMQ', category: 'Tools', color: '#F59E0B', fields: ['backend'] },
  // Languages (cross-field)
  {
    name: 'TypeScript',
    category: 'Languages',
    color: '#8B5CF6',
    fields: ['frontend', 'backend', 'fullstack'],
  },
  {
    name: 'JavaScript',
    category: 'Languages',
    color: '#8B5CF6',
    fields: ['frontend', 'fullstack'],
  },
  { name: 'Python', category: 'Languages', color: '#8B5CF6', fields: ['backend', 'data'] },
  { name: 'Go', category: 'Languages', color: '#8B5CF6', fields: ['backend', 'devops'] },
  { name: 'Java', category: 'Languages', color: '#8B5CF6', fields: ['backend', 'mobile'] },
  { name: 'C#', category: 'Languages', color: '#8B5CF6', fields: ['backend'] },
  { name: 'PHP', category: 'Languages', color: '#8B5CF6', fields: ['backend'] },
  { name: 'Rust', category: 'Languages', color: '#8B5CF6', fields: ['backend'] },
  { name: 'Swift', category: 'Languages', color: '#8B5CF6', fields: ['mobile'] },
  { name: 'Kotlin', category: 'Languages', color: '#8B5CF6', fields: ['mobile'] },
  { name: 'Dart', category: 'Languages', color: '#8B5CF6', fields: ['mobile'] },
  { name: 'SQL', category: 'Languages', color: '#8B5CF6', fields: ['backend', 'data'] },
  { name: 'R', category: 'Languages', color: '#8B5CF6', fields: ['data'] },
  // Fullstack extras (added to existing cross-field items above)
  { name: 'Prisma', category: 'Tools', color: '#F59E0B', fields: ['fullstack', 'backend'] },
  { name: 'tRPC', category: 'Frameworks', color: '#3B82F6', fields: ['fullstack'] },
  { name: 'Remix', category: 'Frameworks', color: '#3B82F6', fields: ['fullstack'] },
  { name: 'Astro', category: 'Frameworks', color: '#3B82F6', fields: ['fullstack', 'frontend'] },
  { name: 'Supabase', category: 'Tools', color: '#F59E0B', fields: ['fullstack'] },
  { name: 'Firebase', category: 'Tools', color: '#F59E0B', fields: ['fullstack', 'mobile'] },
  // Databases
  {
    name: 'PostgreSQL',
    category: 'Databases',
    color: '#10B981',
    fields: ['backend', 'fullstack', 'data'],
  },
  { name: 'MongoDB', category: 'Databases', color: '#10B981', fields: ['backend', 'fullstack'] },
  { name: 'Redis', category: 'Databases', color: '#10B981', fields: ['backend', 'devops'] },
  { name: 'MySQL', category: 'Databases', color: '#10B981', fields: ['backend'] },
  { name: 'Elasticsearch', category: 'Databases', color: '#10B981', fields: ['backend', 'data'] },
  { name: 'ClickHouse', category: 'Databases', color: '#10B981', fields: ['data', 'backend'] },
  { name: 'DynamoDB', category: 'Databases', color: '#10B981', fields: ['devops', 'backend'] },
  // DevOps (12)
  {
    name: 'Docker',
    category: 'DevOps',
    color: '#EF4444',
    fields: ['devops', 'backend', 'fullstack'],
  },
  { name: 'Kubernetes', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  { name: 'AWS', category: 'DevOps', color: '#EF4444', fields: ['devops', 'backend'] },
  { name: 'GCP', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  { name: 'Azure', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  { name: 'CI/CD', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  { name: 'Terraform', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  { name: 'Ansible', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  { name: 'Linux', category: 'DevOps', color: '#EF4444', fields: ['devops', 'backend'] },
  { name: 'Nginx', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  { name: 'Prometheus', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  { name: 'Grafana', category: 'DevOps', color: '#EF4444', fields: ['devops'] },
  // Mobile (10)
  { name: 'React Native', category: 'Frameworks', color: '#3B82F6', fields: ['mobile'] },
  { name: 'Flutter', category: 'Frameworks', color: '#3B82F6', fields: ['mobile'] },
  { name: 'SwiftUI', category: 'Frameworks', color: '#3B82F6', fields: ['mobile'] },
  { name: 'Jetpack Compose', category: 'Frameworks', color: '#3B82F6', fields: ['mobile'] },
  { name: 'Expo', category: 'Tools', color: '#F59E0B', fields: ['mobile'] },
  { name: 'Xcode', category: 'Tools', color: '#F59E0B', fields: ['mobile'] },
  { name: 'Android Studio', category: 'Tools', color: '#F59E0B', fields: ['mobile'] },
  { name: 'App Store / Play Store', category: 'Tools', color: '#F59E0B', fields: ['mobile'] },
  { name: 'Push Notifications', category: 'Tools', color: '#F59E0B', fields: ['mobile'] },
  { name: 'Mobile CI/CD', category: 'DevOps', color: '#EF4444', fields: ['mobile'] },
  // Data (12)
  { name: 'Pandas', category: 'Frameworks', color: '#3B82F6', fields: ['data'] },
  { name: 'NumPy', category: 'Frameworks', color: '#3B82F6', fields: ['data'] },
  { name: 'TensorFlow', category: 'Frameworks', color: '#3B82F6', fields: ['data'] },
  { name: 'PyTorch', category: 'Frameworks', color: '#3B82F6', fields: ['data'] },
  { name: 'Scikit-learn', category: 'Frameworks', color: '#3B82F6', fields: ['data'] },
  { name: 'Apache Spark', category: 'Tools', color: '#F59E0B', fields: ['data'] },
  { name: 'Apache Kafka', category: 'Tools', color: '#F59E0B', fields: ['data', 'backend'] },
  { name: 'Airflow', category: 'Tools', color: '#F59E0B', fields: ['data'] },
  { name: 'dbt', category: 'Tools', color: '#F59E0B', fields: ['data'] },
  { name: 'Jupyter', category: 'Tools', color: '#F59E0B', fields: ['data'] },
  { name: 'Power BI', category: 'Tools', color: '#F59E0B', fields: ['data', 'product'] },
  { name: 'Tableau', category: 'Tools', color: '#F59E0B', fields: ['data', 'product'] },
  // Design (10)
  { name: 'Figma', category: 'Tools', color: '#F59E0B', fields: ['design', 'frontend', 'product'] },
  { name: 'Sketch', category: 'Tools', color: '#F59E0B', fields: ['design'] },
  { name: 'Adobe XD', category: 'Tools', color: '#F59E0B', fields: ['design'] },
  { name: 'Adobe Photoshop', category: 'Tools', color: '#F59E0B', fields: ['design'] },
  { name: 'Adobe Illustrator', category: 'Tools', color: '#F59E0B', fields: ['design'] },
  { name: 'Prototyping', category: 'Soft Skills', color: '#EC4899', fields: ['design'] },
  { name: 'Design Systems', category: 'Tools', color: '#F59E0B', fields: ['design', 'frontend'] },
  { name: 'UX Research', category: 'Soft Skills', color: '#EC4899', fields: ['design', 'product'] },
  {
    name: 'Responsive Design',
    category: 'Soft Skills',
    color: '#EC4899',
    fields: ['design', 'frontend'],
  },
  {
    name: 'Accessibility (a11y)',
    category: 'Soft Skills',
    color: '#EC4899',
    fields: ['design', 'frontend'],
  },
  // Product (10)
  { name: 'Jira', category: 'Tools', color: '#F59E0B', fields: ['product'] },
  { name: 'Confluence', category: 'Tools', color: '#F59E0B', fields: ['product'] },
  { name: 'Notion', category: 'Tools', color: '#F59E0B', fields: ['product'] },
  { name: 'Google Analytics', category: 'Tools', color: '#F59E0B', fields: ['product', 'data'] },
  { name: 'Amplitude', category: 'Tools', color: '#F59E0B', fields: ['product'] },
  { name: 'A/B Testing', category: 'Tools', color: '#F59E0B', fields: ['product'] },
  { name: 'Roadmapping', category: 'Soft Skills', color: '#EC4899', fields: ['product'] },
  { name: 'User Story Mapping', category: 'Soft Skills', color: '#EC4899', fields: ['product'] },
  {
    name: 'Stakeholder Management',
    category: 'Soft Skills',
    color: '#EC4899',
    fields: ['product'],
  },
  { name: 'Agile / Scrum', category: 'Soft Skills', color: '#EC4899', fields: ['product'] },
  // General (always shown)
  { name: 'Git', category: 'Tools', color: '#F59E0B', fields: [] },
  {
    name: 'GraphQL',
    category: 'Frameworks',
    color: '#3B82F6',
    fields: ['frontend', 'backend', 'fullstack'],
  },
  { name: 'REST API', category: 'Tools', color: '#F59E0B', fields: ['backend', 'fullstack'] },
  { name: 'Testing', category: 'Tools', color: '#F59E0B', fields: [] },
  { name: 'Communication', category: 'Soft Skills', color: '#EC4899', fields: ['product'] },
  { name: 'Teamwork', category: 'Soft Skills', color: '#EC4899', fields: [] },
  { name: 'English', category: 'Soft Skills', color: '#EC4899', fields: [] },
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
  const [showPreview, setShowPreview] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // New skill form
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillColor, setNewSkillColor] = useState('#6B7280');

  // Quick-add skills sorted by selected field
  const sortedQuickSkills = useMemo(() => {
    const available = QUICK_ADD_SKILLS.filter(
      (qs) => !skills.some((s) => s.name.toLowerCase() === qs.name.toLowerCase()),
    );
    if (!field) return available;
    const primary = available.filter((s) => s.fields.includes(field));
    const rest = available.filter((s) => !s.fields.includes(field));
    return [...primary, ...rest];
  }, [field, skills]);

  const primaryCount = useMemo(() => {
    if (!field) return 0;
    return sortedQuickSkills.filter((s) => s.fields.includes(field)).length;
  }, [field, sortedQuickSkills]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: DraftData = JSON.parse(raw);
      if (draft.title || draft.skills.length > 0) {
        setTitle(draft.title);
        setCompany(draft.company);
        setDescription(draft.description);
        setField(draft.field);
        setLocation(draft.location);
        setSalaryRange(draft.salaryRange);
        setSkills(draft.skills);
        setHasDraft(true);
      }
    } catch {
      // ignore corrupted draft
    }
  }, []);

  // Auto-save draft
  const saveDraft = useCallback(() => {
    const data: DraftData = { title, company, description, field, location, salaryRange, skills };
    const hasContent =
      title || company || description || field || location || salaryRange || skills.length > 0;
    if (hasContent) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setHasDraft(true);
    }
  }, [title, company, description, field, location, salaryRange, skills]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 500);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle('');
    setCompany('');
    setDescription('');
    setField('');
    setLocation('');
    setSalaryRange('');
    setSkills([]);
    setTouched({});
    setHasDraft(false);
    toast('Draft discarded', 'success');
  };

  const addSkill = (skillName?: string, cat?: string, color?: string) => {
    const name = skillName || newSkillName.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast('Skill already added', 'error');
      return;
    }
    setSkills([
      ...skills,
      {
        name,
        level: newSkillLevel,
        category: cat || newSkillCategory || 'General',
        categoryColor: color || newSkillColor,
      },
    ]);
    if (!skillName) setNewSkillName('');
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const moveSkill = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= skills.length) return;
    const updated = [...skills];
    [updated[index], updated[newIndex]] = [updated[newIndex]!, updated[index]!];
    setSkills(updated);
  };

  const titleError = touched.title && !title.trim() ? 'Title is required' : '';
  const skillsError = touched.skills && skills.length === 0 ? 'At least one skill is required' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, skills: true });
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
      localStorage.removeItem(DRAFT_KEY);
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

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Post a Vacancy</h1>
        </div>
        <div className="flex items-center gap-2">
          {hasDraft && (
            <button
              type="button"
              onClick={discardDraft}
              className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Discard draft
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Preview mode */}
      {showPreview && (
        <div className="space-y-6 mb-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-2">{title || 'Untitled Vacancy'}</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mb-3">
              {company && <span>{company}</span>}
              {location && <span>{location}</span>}
              {salaryRange && <span className="text-emerald-400 font-medium">{salaryRange}</span>}
            </div>
            {field && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                {field}
              </span>
            )}
            {description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-4">
                {description}
              </p>
            )}
          </div>
          {skills.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Required Skills ({skills.length})</h3>
              <div className="space-y-2">
                {skills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: skill.categoryColor }}
                      />
                      <span className="text-sm font-medium">{skill.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{skill.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button type="button" onClick={() => setShowPreview(false)} className="btn-ghost text-sm">
            Back to editing
          </button>
        </div>
      )}

      {!showPreview && (
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
                onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                placeholder="e.g. Senior Frontend Developer"
                className={`input-field ${titleError ? 'border-red-500/50' : ''}`}
                maxLength={200}
                required
              />
              {titleError && <p className="text-xs text-red-400 mt-1">{titleError}</p>}
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
              <button
                type="button"
                onClick={() => addSkill()}
                className="btn-secondary text-sm shrink-0"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {/* Quick-add presets */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Quick add{field ? ` (${field} first)` : ''}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sortedQuickSkills.map((qs, i) => (
                  <span key={qs.name} className="contents">
                    {primaryCount > 0 && i === primaryCount && (
                      <span className="w-px h-5 bg-border mx-1 self-center" />
                    )}
                    <button
                      type="button"
                      onClick={() => addSkill(qs.name, qs.category, qs.color)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        field && qs.fields.includes(field)
                          ? 'border-primary/40 text-primary hover:bg-primary/10'
                          : 'border-border hover:border-primary hover:text-primary'
                      }`}
                    >
                      + {qs.name}
                    </button>
                  </span>
                ))}
              </div>
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
                      <span className="text-xs text-muted-foreground capitalize">
                        {skill.level}
                      </span>
                      <span className="text-[10px] text-muted">{skill.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSkill(i, -1)}
                        disabled={i === 0}
                        className="text-muted hover:text-foreground transition-colors p-0.5 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSkill(i, 1)}
                        disabled={i === skills.length - 1}
                        className="text-muted hover:text-foreground transition-colors p-0.5 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSkill(i)}
                        className="text-muted hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted">
                  {skills.length} skill{skills.length !== 1 ? 's' : ''} added
                </p>
              </div>
            )}

            {skills.length === 0 && (
              <div
                className={`text-center py-4 border border-dashed rounded-lg ${skillsError ? 'border-red-500/50' : 'border-border'}`}
              >
                <p className="text-sm text-muted-foreground">No skills added yet</p>
                {skillsError && <p className="text-xs text-red-400 mt-1">{skillsError}</p>}
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
      )}
    </div>
  );
}
