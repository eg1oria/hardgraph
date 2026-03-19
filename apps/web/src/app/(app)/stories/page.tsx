'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal,
  ChevronDown,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES, FIELDS, SORT_OPTIONS } from '@/lib/stories-constants';
import { StoryCard } from '@/components/stories/StoryCard';
import type { StoryCardData } from '@/components/stories/StoryCard';
import { StoryCardSkeleton } from '@/components/stories/StoryCardSkeleton';
import { FeaturedStories } from '@/components/stories/FeaturedStories';

interface FeedResponse {
  stories: StoryCardData[];
  total: number;
  skip: number;
  limit: number;
}

export default function StoriesFeedPage() {
  const user = useAuthStore((s) => s.user);

  // UX: Grid/List view toggle with localStorage persistence
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('stories-view') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });

  const [stories, setStories] = useState<StoryCardData[]>([]);
  const [featured, setFeatured] = useState<StoryCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState('');
  const [field, setField] = useState('');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UX: Collapsible filters on mobile
  const [filtersOpen, setFiltersOpen] = useState(false);

  // UX: Bookmarks (UI only, client state)
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('story-bookmarks');
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  // UX: Infinite scroll ref
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stories-view', viewMode);
    }
  }, [viewMode]);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('story-bookmarks', JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Load featured stories once
  useEffect(() => {
    api
      .get<FeedResponse>('/stories/feed?sort=popular&limit=5')
      .then((data) => setFeatured(data.stories))
      .catch(() => {});
  }, []);

  const loadFeed = useCallback(
    (skip = 0, append = false) => {
      if (!append) setLoading(true);
      else {
        setLoadingMore(true);
        loadingMoreRef.current = true;
      }

      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (field) params.set('field', field);
      if (sort) params.set('sort', sort);
      if (debouncedSearch) params.set('search', debouncedSearch);
      params.set('skip', String(skip));
      params.set('limit', '20');

      api
        .get<FeedResponse>(`/stories/feed?${params}`)
        .then((data) => {
          if (append) {
            setStories((prev) => [...prev, ...data.stories]);
          } else {
            setStories(data.stories);
          }
          setTotal(data.total);
          setError(false);
        })
        .catch(() => setError(true))
        .finally(() => {
          setLoading(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        });
    },
    [category, field, sort, debouncedSearch],
  );

  useEffect(() => {
    loadFeed(0, false);
  }, [loadFeed]);

  // UX: IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMoreRef.current) {
          setStories((prev) => {
            if (prev.length > 0 && prev.length < total) {
              loadFeed(prev.length, true);
            }
            return prev;
          });
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [total, loadFeed]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Stories</h1>
          <p className="text-muted-foreground mt-2 text-sm">Real experiences from the community</p>
        </div>
        <div className="flex items-center gap-2">
          {/* UX: Grid/List toggle */}
          <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>

          {user && (
            <Link href="/stories/new" className="btn-primary shrink-0 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Write
            </Link>
          )}
        </div>
      </div>

      {/* UX: Featured/Trending section */}
      {!loading && !debouncedSearch && !category && featured.length > 0 && (
        <FeaturedStories stories={featured} />
      )}

      {/* Filters */}
      <div className="space-y-4 mb-8">
        {/* Search + mobile filter toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
              aria-label="Search stories"
            />
          </div>
          {/* UX: Mobile collapsible filters toggle */}
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={filtersOpen}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <ChevronDown
              className={`w-3 h-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Filter panel — always visible on sm+, collapsible on mobile */}
        <div className={`space-y-3 ${filtersOpen ? 'block' : 'hidden'} sm:block`}>
          {/* UX: Category chips with icons */}
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Filter by category">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  role="radio"
                  aria-checked={category === cat.value}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${
                    category === cat.value
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Field + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="input-field text-sm"
              aria-label="Filter by field"
            >
              {FIELDS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <div
              className="flex items-center gap-0.5 border border-border rounded-lg p-0.5"
              role="radiogroup"
              aria-label="Sort order"
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  role="radio"
                  aria-checked={sort === opt.value}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none ${
                    sort === opt.value
                      ? 'bg-foreground/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* UX: Active count indicator */}
            {!loading && (
              <span className="text-xs text-muted-foreground ml-auto">
                {total} {total === 1 ? 'story' : 'stories'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        // UX: Skeleton loading — 6 skeleton cards
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
              : 'divide-y divide-border'
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <StoryCardSkeleton key={i} variant={viewMode} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load stories"
          description="Something went wrong. Please try again."
          action={
            <button onClick={() => loadFeed(0, false)} className="btn-secondary text-sm">
              Try again
            </button>
          }
        />
      ) : stories.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-10 h-10" />}
          title={debouncedSearch ? 'No matching stories found' : 'No stories yet'}
          description="Be the first to share your experience with the community."
          action={
            user ? (
              <Link href="/stories/new" className="btn-primary text-sm">
                Write your story
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            // UX: Card-based grid layout
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  variant="grid"
                  bookmarked={bookmarks.has(story.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          ) : (
            // UX: List layout with hover effects
            <div className="divide-y divide-border">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  variant="list"
                  bookmarked={bookmarks.has(story.id)}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}

          {/* UX: Infinite scroll sentinel */}
          {stories.length < total && (
            <div ref={sentinelRef} className="flex justify-center py-10">
              {loadingMore && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Loading more...
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
