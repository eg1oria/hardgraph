'use client';

import Link from 'next/link';
import { CATEGORY_COLORS, CATEGORY_LABELS, formatDate } from '@/lib/stories-constants';

// UX: Featured/trending stories horizontal scroll section with gradient overlay

interface FeaturedStory {
  id: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  category: string;
  readTime: number;
  publishedAt: string | null;
  author: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface FeaturedStoriesProps {
  stories: FeaturedStory[];
}

export function FeaturedStories({ stories }: FeaturedStoriesProps) {
  if (stories.length === 0) return null;

  return (
    <section className="mb-10" aria-label="Featured stories">
      <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Trending</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
        {stories.map((story) => (
          <Link
            key={story.id}
            href={`/stories/${story.id}`}
            className="group shrink-0 w-72 sm:w-80 snap-start"
          >
            <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-surface-light">
              {story.coverUrl ? (
                <img
                  src={story.coverUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-surface-light" />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border mb-2 ${
                    CATEGORY_COLORS[story.category] || CATEGORY_COLORS.other
                  }`}
                >
                  {CATEGORY_LABELS[story.category] || story.category}
                </span>
                <h3 className="text-white font-semibold line-clamp-2 text-sm leading-snug mb-1 group-hover:text-primary-300 transition-colors">
                  {story.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>{story.author.displayName || story.author.username}</span>
                  <span>·</span>
                  <span>{story.readTime} min</span>
                  {story.publishedAt && (
                    <>
                      <span>·</span>
                      <span>{formatDate(story.publishedAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
