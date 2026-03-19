'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Save, Send, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const CATEGORIES = [
  { value: 'career_growth', label: 'Career Growth 📈' },
  { value: 'got_offer', label: 'Got an Offer 🎯' },
  { value: 'switched_field', label: 'Switched Field 🔄' },
  { value: 'side_project', label: 'Side Project 🚀' },
  { value: 'mentorship', label: 'Mentorship 🤝' },
  { value: 'learning', label: 'Learning Path 📚' },
  { value: 'other', label: 'Other' },
];

const FIELDS = [
  { value: '', label: 'Select field (optional)' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Design', label: 'Design' },
  { value: 'Business', label: 'Business' },
  { value: 'Creative', label: 'Creative' },
  { value: 'Professional', label: 'Professional' },
];

interface StoryData {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverUrl: string | null;
  category: string;
  field: string | null;
  tags: string[];
  graphId: string | null;
  isPublished: boolean;
  graph: { id: string; title: string; slug: string } | null;
}

interface UserGraph {
  id: string;
  title: string;
}

/** Simple markdown preview */
function renderPreview(md: string) {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  function inlineFormat(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    while (remaining.length > 0) {
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 bg-surface-light rounded text-sm font-mono text-primary-400"
          >
            {codeMatch[1]}
          </code>,
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        parts.push(<em key={key++}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {linkMatch[1]}
          </a>,
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }
      const nextSpecial = remaining.search(/[`*[]/); // eslint-disable-line no-useless-escape
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }
    return parts.length === 1 ? parts[0] : parts;
  }

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith('```')) {
        codeLines.push(lines[i]!);
        i++;
      }
      i++;
      elements.push(
        <pre
          key={elements.length}
          className="bg-surface-light rounded-lg p-4 overflow-x-auto my-4 text-sm font-mono"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={elements.length} className="text-lg font-semibold mt-6 mb-2">
          {inlineFormat(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={elements.length} className="text-xl font-bold mt-8 mb-3">
          {inlineFormat(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={elements.length} className="text-2xl font-bold mt-8 mb-4">
          {inlineFormat(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }
    if (line.match(/^[-*] /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i]!.match(/^[-*] /)) {
        items.push(<li key={items.length}>{inlineFormat(lines[i]!.slice(2))}</li>);
        i++;
      }
      elements.push(
        <ul
          key={elements.length}
          className="list-disc list-inside my-3 space-y-1 text-muted-foreground"
        >
          {items}
        </ul>,
      );
      continue;
    }
    if (line.trim() === '') {
      i++;
      continue;
    }
    elements.push(
      <p key={elements.length} className="my-3 text-muted-foreground leading-relaxed">
        {inlineFormat(line)}
      </p>,
    );
    i++;
  }
  return elements;
}

export default function EditStoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [category, setCategory] = useState('career_growth');
  const [field, setField] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [graphId, setGraphId] = useState('');
  const [graphs, setGraphs] = useState<UserGraph[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(false);

  const storyId = params.id;

  const loadStory = useCallback(() => {
    setLoading(true);
    // We need to fetch story as author — use the feed endpoint with the story id
    // Actually, let's just fetch and let the backend handle auth
    api
      .get<StoryData>(`/stories/${storyId}`)
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        setExcerpt(data.excerpt || '');
        setCoverUrl(data.coverUrl || '');
        setCategory(data.category);
        setField(data.field || '');
        setTags(data.tags);
        setGraphId(data.graphId || '');
        setIsPublished(data.isPublished);
      })
      .catch(() => {
        toast('Failed to load story', 'error');
        router.push('/stories');
      })
      .finally(() => setLoading(false));
  }, [storyId, router, toast]);

  useEffect(() => {
    loadStory();
    api
      .get<UserGraph[]>('/graphs')
      .then(setGraphs)
      .catch(() => {});
  }, [loadStory]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!tags.includes(tag) && tags.length < 10) {
        setTags((prev) => [...prev, tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast('Title and content are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/stories/${storyId}`, {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
        category,
        field: field || undefined,
        tags,
        graphId: graphId || undefined,
      });
      toast('Saved!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast('Title and content are required', 'error');
      return;
    }
    setPublishing(true);
    try {
      await api.put(`/stories/${storyId}`, {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
        category,
        field: field || undefined,
        tags,
        graphId: graphId || undefined,
      });
      await api.post(`/stories/${storyId}/publish`);
      setIsPublished(true);
      toast('Published!', 'success');
      router.push(`/stories/${storyId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish';
      toast(message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this story? This cannot be undone.')) return;
    try {
      await api.delete(`/stories/${storyId}`);
      toast('Story deleted', 'success');
      router.push('/stories');
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to stories
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview((p) => !p)}
            className="btn-ghost text-sm flex items-center gap-1.5"
          >
            {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleDelete}
            className="btn-ghost text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {isPublished && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
          This story is published.{' '}
          <Link href={`/stories/${storyId}`} className="underline">
            View it →
          </Link>
        </div>
      )}

      {preview ? (
        <div className="card">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-400 mb-3">
            {CATEGORIES.find((c) => c.value === category)?.label || category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">{title || 'Untitled'}</h1>
          {excerpt && <p className="text-muted-foreground mb-4 italic">{excerpt}</p>}
          <div className="prose-custom">{renderPreview(content)}</div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-xs bg-surface-light text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your story title..."
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold outline-none placeholder:text-muted-foreground/50 border-none"
            maxLength={300}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Field
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="input-field w-full"
              >
                {FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Tags <span className="text-muted">(press Enter to add)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-surface-light text-muted-foreground"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-400 transition-colors"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="frontend, medicine, senior..."
              className="input-field w-full"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Cover image URL <span className="text-muted">(optional)</span>
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="input-field w-full"
              maxLength={500}
            />
            {coverUrl && (
              <div className="mt-2 rounded-lg overflow-hidden">
                <img src={coverUrl} alt="Cover preview" className="w-full max-h-48 object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Excerpt <span className="text-muted">(brief description for the feed)</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief summary of your story..."
              className="input-field w-full resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Content <span className="text-muted">(Markdown supported)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your story..."
              className="input-field w-full resize-none font-mono text-sm"
              rows={20}
            />
          </div>

          {graphs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Link to your skill tree <span className="text-muted">(optional)</span>
              </label>
              <select
                value={graphId}
                onChange={(e) => setGraphId(e.target.value)}
                className="input-field w-full"
              >
                <option value="">None</option>
                {graphs.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving || publishing}
              className="btn-secondary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            {!isPublished && (
              <button
                onClick={handlePublish}
                disabled={saving || publishing}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
