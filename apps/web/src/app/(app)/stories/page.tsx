'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Clock, Search, Plus, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/useAuthStore';

interface StoryCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  category: string;
  tags: string[];
  field: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readTime: number;
  publishedAt: string | null;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface FeedResponse {
  stories: StoryCard[];
  total: number;
  skip: number;
  limit: number;
}

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'got_offer', label: 'Got an Offer' },
  { value: 'career_growth', label: 'Career Growth' },
  { value: 'switched_field', label: 'Switched Field' },
  { value: 'side_project', label: 'Side Project' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'learning', label: 'Learning Path' },
  { value: 'other', label: 'Other' },
];

const FIELDS = [
  { value: '', label: 'All Fields' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Design', label: 'Design' },
  { value: 'Business', label: 'Business' },
  { value: 'Creative', label: 'Creative' },
  { value: 'Professional', label: 'Professional' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent' },
  { value: 'popular', label: 'Popular' },
  { value: 'most_liked', label: 'Most Liked' },
];

const CATEGORY_COLORS: Record<string, string> = {
  got_offer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  career_growth: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  switched_field: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  side_project: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  mentorship: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  learning: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const CATEGORY_LABELS: Record<string, string> = {
  got_offer: 'Got an Offer',
  career_growth: 'Career Growth',
  switched_field: 'Switched Field',
  side_project: 'Side Project',
  mentorship: 'Mentorship',
  learning: 'Learning Path',
  other: 'Other',
};

export default function StoriesFeedPage() {
  const user = useAuthStore((s) => s.user);
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState('');
  const [field, setField] = useState('');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFeed = useCallback(
    (skip = 0, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

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
        });
    },
    [category, field, sort, debouncedSearch],
  );

  useEffect(() => {
    loadFeed(0, false);
  }, [loadFeed]);

  const handleLoadMore = () => {
    loadFeed(stories.length, true);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Stories</h1>
          <p className="text-muted-foreground mt-2 text-sm">Real experiences from the community</p>
        </div>
        {user && (
          <Link href="/stories/new" className="btn-primary shrink-0 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Write
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-10">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                category === cat.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Field + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="input-field text-sm"
          >
            {FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-0.5 border border-border rounded-lg p-0.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  sort === opt.value
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="mb-3">Failed to load stories</p>
          <button onClick={() => loadFeed(0, false)} className="btn-secondary text-sm">
            Try again
          </button>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="mb-2">{debouncedSearch ? 'No matching stories found' : 'No stories yet'}</p>
          <p className="text-sm mb-6">Be the first to share your experience.</p>
          {user && (
            <Link href="/stories/new" className="btn-primary text-sm">
              Write your story
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="group flex gap-4 sm:gap-6 py-6 first:pt-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar
                      src={story.author.avatarUrl ?? undefined}
                      fallback={story.author.displayName || story.author.username}
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {story.author.displayName || story.author.username}
                    </span>
                    {story.publishedAt && (
                      <>
                        <span className="text-xs text-muted">·</span>
                        <span className="text-xs text-muted">{formatDate(story.publishedAt)}</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {story.title}
                  </h3>

                  {story.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {story.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        CATEGORY_COLORS[story.category] || CATEGORY_COLORS.other
                      }`}
                    >
                      {CATEGORY_LABELS[story.category] || story.category}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {story.readTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {story.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {story.commentCount}
                      </span>
                    </div>
                  </div>
                </div>

                {story.coverUrl && (
                  <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-24 rounded-lg overflow-hidden">
                    <img
                      src={story.coverUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Load more */}
          {stories.length < total && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-full transition-colors"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
                {!loadingMore && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
