'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Eye, Heart, MessageCircle, Clock, Search, Plus } from 'lucide-react';
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
  { value: 'got_offer', label: 'Got an Offer 🎯' },
  { value: 'career_growth', label: 'Career Growth 📈' },
  { value: 'switched_field', label: 'Switched Field 🔄' },
  { value: 'side_project', label: 'Side Project 🚀' },
  { value: 'mentorship', label: 'Mentorship 🤝' },
  { value: 'learning', label: 'Learning Path 📚' },
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
  got_offer: 'bg-emerald-500/10 text-emerald-400',
  career_growth: 'bg-blue-500/10 text-blue-400',
  switched_field: 'bg-purple-500/10 text-purple-400',
  side_project: 'bg-orange-500/10 text-orange-400',
  mentorship: 'bg-pink-500/10 text-pink-400',
  learning: 'bg-cyan-500/10 text-cyan-400',
  other: 'bg-gray-500/10 text-gray-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  got_offer: 'Got an Offer 🎯',
  career_growth: 'Career Growth 📈',
  switched_field: 'Switched Field 🔄',
  side_project: 'Side Project 🚀',
  mentorship: 'Mentorship 🤝',
  learning: 'Learning Path 📚',
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

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Stories
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Career stories and experiences from the community
          </p>
        </div>
        {user && (
          <Link href="/stories/new" className="btn-primary shrink-0">
            <Plus className="w-4 h-4" />
            Write your story
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6 sm:mb-8">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search + Field + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="input-field min-w-[140px]"
          >
            {FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sort === opt.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
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
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="mb-3">Failed to load stories</p>
          <button onClick={() => loadFeed(0, false)} className="btn-secondary text-sm">
            Try again
          </button>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="mb-2">{debouncedSearch ? 'No matching stories found' : 'No stories yet'}</p>
          <p className="text-sm mb-4">Be the first to share your career experience!</p>
          {user && (
            <Link href="/stories/new" className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              Write your story
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="card card-hover group flex flex-col"
              >
                {story.coverUrl && (
                  <div className="relative -mx-5 -mt-5 mb-4 rounded-t-xl overflow-hidden">
                    <img
                      src={story.coverUrl}
                      alt=""
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      CATEGORY_COLORS[story.category] || CATEGORY_COLORS.other
                    }`}
                  >
                    {CATEGORY_LABELS[story.category] || story.category}
                  </span>
                  {story.field && (
                    <span className="text-xs text-muted-foreground">{story.field}</span>
                  )}
                </div>

                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {story.title}
                </h3>

                {story.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{story.excerpt}</p>
                )}

                <div className="mt-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar
                      src={story.author.avatarUrl ?? undefined}
                      fallback={story.author.displayName || story.author.username}
                      size="sm"
                    />
                    <span className="text-sm text-muted-foreground truncate">
                      {story.author.displayName || story.author.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {story.readTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {story.viewCount}
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

                  {story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {story.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-surface-light text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          {stories.length < total && (
            <div className="flex justify-center mt-8">
              <button onClick={handleLoadMore} disabled={loadingMore} className="btn-secondary">
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
