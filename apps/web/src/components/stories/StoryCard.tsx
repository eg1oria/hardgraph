'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Clock, Bookmark } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CATEGORY_COLORS, CATEGORY_LABELS, formatDate } from '@/lib/stories-constants';

// UX: Reusable story card component with Grid/List variants, hover effects, bookmark

export interface StoryCardData {
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

interface StoryCardProps {
  story: StoryCardData;
  variant: 'grid' | 'list';
  bookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

export function StoryCard({ story, variant, bookmarked, onToggleBookmark }: StoryCardProps) {
  if (variant === 'grid') {
    return <GridCard story={story} bookmarked={bookmarked} onToggleBookmark={onToggleBookmark} />;
  }
  return <ListCard story={story} bookmarked={bookmarked} onToggleBookmark={onToggleBookmark} />;
}

function GridCard({ story, bookmarked, onToggleBookmark }: Omit<StoryCardProps, 'variant'>) {
  return (
    <div className="group relative rounded-xl border border-border bg-surface overflow-hidden transition-all duration-200 hover:border-border-light hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
      <Link href={`/stories/${story.id}`} className="block">
        {/* Cover image */}
        <div className="relative aspect-video bg-surface-light overflow-hidden">
          {story.coverUrl ? (
            <img
              src={story.coverUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <span className="text-3xl font-bold opacity-10">{story.title[0]?.toUpperCase()}</span>
            </div>
          )}
          {/* Category badge overlay */}
          <span
            className={`absolute top-3 left-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-sm ${
              CATEGORY_COLORS[story.category] || CATEGORY_COLORS.other
            }`}
          >
            {CATEGORY_LABELS[story.category] || story.category}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
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

          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
            {story.title}
          </h3>

          {story.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{story.excerpt}</p>
          )}

          {/* UX: Hover preview — extended excerpt fades in */}
          {story.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-4 mb-3 hidden group-hover:block animate-fade-in">
              {story.excerpt}
            </p>
          )}

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
      </Link>

      {/* Bookmark button */}
      {onToggleBookmark && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark(story.id);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
}

function ListCard({ story, bookmarked, onToggleBookmark }: Omit<StoryCardProps, 'variant'>) {
  return (
    <div className="group relative flex gap-4 sm:gap-6 py-5 px-4 -mx-4 rounded-xl transition-all duration-200 hover:bg-surface-light/50">
      <Link href={`/stories/${story.id}`} className="flex-1 min-w-0 flex gap-4 sm:gap-6">
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
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{story.excerpt}</p>
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
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
      </Link>

      {/* Bookmark */}
      {onToggleBookmark && (
        <button
          onClick={() => onToggleBookmark(story.id)}
          className="shrink-0 self-start mt-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current text-primary' : ''}`} />
        </button>
      )}
    </div>
  );
}
