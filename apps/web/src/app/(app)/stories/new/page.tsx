'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, Upload, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Tabs } from '@/components/ui/Tabs';
import { renderMarkdown } from '@/lib/renderMarkdown';
import {
  EDITOR_CATEGORIES,
  EDITOR_FIELDS,
  POPULAR_TAGS,
  wordCount,
  estimateReadTime,
} from '@/lib/stories-constants';
import { MarkdownToolbar } from '@/components/stories/MarkdownToolbar';

interface UserGraph {
  id: string;
  title: string;
}

export default function NewStoryPage() {
  const router = useRouter();
  const { toast } = useToast();

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
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // UX: Step wizard (3 steps)
  const [step, setStep] = useState(1);

  // UX: Split-pane / tab mode for editor
  const [editorTab, setEditorTab] = useState('edit');

  // UX: Tag autocomplete
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // UX: Unsaved changes tracking
  const [isDirty, setIsDirty] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    api
      .get<UserGraph[]>('/graphs')
      .then(setGraphs)
      .catch(() => {});
  }, []);

  // UX: Unsaved changes warning
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Mark dirty on any content change
  useEffect(() => {
    if (title || content || excerpt || coverUrl) {
      setIsDirty(true);
    }
  }, [title, content, excerpt, coverUrl]);

  const handleTagInput = (value: string) => {
    setTagInput(value);
    if (value.trim()) {
      const filtered = POPULAR_TAGS.filter(
        (t) => t.includes(value.toLowerCase()) && !tags.includes(t),
      ).slice(0, 5);
      setTagSuggestions(filtered);
      setShowTagSuggestions(filtered.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !tags.includes(normalized) && tags.length < 10) {
      setTags((prev) => [...prev, normalized]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleContentInsert = useCallback((value: string) => {
    setContent(value);
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast('Title and content are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post<{ id: string }>('/stories', {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
        category,
        field: field || undefined,
        tags,
        graphId: graphId || undefined,
      });
      setIsDirty(false);
      toast('Draft saved!', 'success');
      router.push(`/stories/${res.id}/edit`);
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
      const res = await api.post<{ id: string }>('/stories', {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
        category,
        field: field || undefined,
        tags,
        graphId: graphId || undefined,
      });
      await api.post(`/stories/${res.id}/publish`);
      setIsDirty(false);
      toast('Story published!', 'success');
      router.push(`/stories/${res.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish';
      toast(message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const words = wordCount(content);
  const readTime = estimateReadTime(content);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to stories
        </Link>

        {/* UX: Unsaved indicator */}
        {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>

      {/* UX: Step progress bar */}
      <div
        className="flex items-center gap-2 mb-8"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={3}
      >
        {[
          { n: 1, label: 'Content' },
          { n: 2, label: 'Details' },
          { n: 3, label: 'Review' },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setStep(n)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                step === n ? 'text-foreground' : step > n ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
                  step === n
                    ? 'bg-primary text-white border-primary'
                    : step > n
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'border-border text-muted-foreground'
                }`}
              >
                {step > n ? <Check className="w-3.5 h-3.5" /> : n}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {n < 3 && <div className={`flex-1 h-px ${step > n ? 'bg-primary/30' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Title + Content */}
      {step === 1 && (
        <div className="space-y-5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your story title..."
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold outline-none placeholder:text-muted-foreground/50 border-none"
            maxLength={300}
            aria-label="Story title"
          />

          {/* UX: Split-pane on desktop / tabs on mobile */}
          <div className="lg:hidden mb-3">
            <Tabs
              tabs={[
                { id: 'edit', label: 'Edit' },
                { id: 'preview', label: 'Preview' },
              ]}
              activeTab={editorTab}
              onChange={setEditorTab}
            />
          </div>

          <div className="flex gap-4">
            {/* Editor pane */}
            <div className={`flex-1 min-w-0 ${editorTab === 'preview' ? 'hidden lg:block' : ''}`}>
              {/* UX: Markdown toolbar */}
              <MarkdownToolbar textareaRef={textareaRef} onInsert={handleContentInsert} />

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your story... Use Markdown for formatting: **bold**, *italic*, # headings, - lists, ```code blocks```"
                className="input-field w-full resize-none font-mono text-sm mt-2"
                rows={24}
                aria-label="Story content"
              />

              {/* UX: Word count + read time */}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{words} words</span>
                <span>·</span>
                <span>~{readTime} min read</span>
              </div>
            </div>

            {/* UX: Live preview pane (desktop) */}
            <div
              className={`flex-1 min-w-0 border border-border rounded-lg p-5 max-h-[600px] overflow-y-auto ${
                editorTab === 'edit' ? 'hidden lg:block' : ''
              }`}
            >
              <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                Preview
              </div>
              {content ? (
                <div className="prose-custom">{renderMarkdown(content)}</div>
              ) : (
                <p className="text-sm text-muted italic">Start writing to see preview...</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!title.trim() || !content.trim()}
              className="btn-primary flex items-center gap-2"
            >
              Next: Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Meta (Category, Field, Tags, Cover, Excerpt, Graph) */}
      {step === 2 && (
        <div className="space-y-5 max-w-2xl">
          {/* Category + Field */}
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
                {EDITOR_CATEGORIES.map((c) => (
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
                {EDITOR_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags with autocomplete */}
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
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => handleTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                placeholder="frontend, medicine, senior..."
                className="input-field w-full"
                maxLength={50}
                aria-label="Add tag"
              />
              {/* UX: Tag autocomplete dropdown */}
              {showTagSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                  {tagSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => addTag(suggestion)}
                      className="block w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-light transition-colors"
                    >
                      #{suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* UX: Drag & drop cover zone */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Cover image
            </label>
            {coverUrl ? (
              <div className="relative rounded-lg overflow-hidden mb-2">
                <img src={coverUrl} alt="Cover preview" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => setCoverUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white transition-colors text-xs"
                  aria-label="Remove cover"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/30 transition-colors">
                <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Paste an image URL below</p>
              </div>
            )}
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="input-field w-full mt-2"
              maxLength={500}
            />
          </div>

          {/* Excerpt */}
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

          {/* Graph link */}
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

          <div className="flex items-center justify-between gap-3 pt-4">
            <button
              onClick={() => setStep(1)}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary flex items-center gap-2">
              Next: Review <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Publish */}
      {step === 3 && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-xl border border-border p-5 sm:p-6">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-400 mb-3">
              {EDITOR_CATEGORIES.find((c) => c.value === category)?.label || category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">{title || 'Untitled'}</h1>
            {excerpt && <p className="text-muted-foreground mb-4 italic">{excerpt}</p>}
            {coverUrl && (
              <div className="rounded-lg overflow-hidden mb-4">
                <img src={coverUrl} alt="Cover" className="w-full max-h-48 object-cover" />
              </div>
            )}
            <div className="prose-custom">{renderMarkdown(content)}</div>
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

          {/* UX: Word count summary */}
          <div className="text-sm text-muted-foreground">
            {words} words · ~{readTime} min read
            {field && ` · ${field}`}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <button
              onClick={() => setStep(2)}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || publishing}
                className="btn-secondary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={saving || publishing}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
