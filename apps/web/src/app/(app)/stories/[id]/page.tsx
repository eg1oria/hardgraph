'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  Trash2,
  Reply,
  Share2,
  Bookmark,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';
import { renderMarkdown, extractHeadings } from '@/lib/renderMarkdown';
import { CATEGORY_COLORS, CATEGORY_LABELS, formatDateLong, timeAgo } from '@/lib/stories-constants';
import { ReadingProgress } from '@/components/stories/ReadingProgress';
import { TableOfContents } from '@/components/stories/TableOfContents';
import { ShareModal } from '@/components/stories/ShareModal';
import { ImageLightbox } from '@/components/stories/ImageLightbox';

interface StoryDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverUrl: string | null;
  category: string;
  tags: string[];
  field: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readTime: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  graph: { id: string; title: string; slug: string } | null;
}

interface Comment {
  id: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  authorId: string;
  storyId: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface SidebarStory {
  id: string;
  title: string;
  category: string;
  readTime: number;
  publishedAt: string | null;
  author?: { username: string; displayName: string | null };
}

function buildCommentTree(comments: Comment[]) {
  const map = new Map<string, Comment & { children: Comment[] }>();
  const roots: (Comment & { children: Comment[] })[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, children: [] });
  }
  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function CommentItem({
  comment,
  userId,
  onReply,
  onDelete,
  depth,
}: {
  comment: Comment & { children: Comment[] };
  userId: string | null;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  depth: number;
}) {
  return (
    <div className={depth > 0 ? 'ml-6 sm:ml-8 border-l border-border/50 pl-4' : ''}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Avatar
            src={comment.author?.avatarUrl ?? undefined}
            fallback={comment.author?.displayName || comment.author?.username || '?'}
            size="sm"
          />
          <span className="text-sm font-medium text-foreground">
            {comment.author?.displayName || comment.author?.username || 'User'}
          </span>
          <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
        </div>
        {/* UX: Markdown support in comments via renderMarkdown */}
        <div className="text-sm text-muted-foreground ml-7 prose-sm">
          {renderMarkdown(comment.content)}
        </div>
        <div className="flex items-center gap-3 mt-1.5 ml-7">
          {userId && depth < 3 && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
              aria-label="Reply to comment"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
          )}
          {userId === comment.authorId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-muted hover:text-red-400 transition-colors flex items-center gap-1"
              aria-label="Delete comment"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
        </div>
      </div>
      {comment.children.map((child) => (
        <CommentItem
          key={child.id}
          comment={child as Comment & { children: Comment[] }}
          userId={userId}
          onReply={onReply}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function StoryReadPage() {
  const params = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const [story, setStory] = useState<StoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const [moreFromAuthor, setMoreFromAuthor] = useState<SidebarStory[]>([]);
  const [related, setRelated] = useState<SidebarStory[]>([]);

  // UX: Share modal
  const [shareOpen, setShareOpen] = useState(false);

  // UX: Image lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // UX: Bookmark (UI only)
  const [bookmarked, setBookmarked] = useState(false);

  // UX: Reading time left
  const [minLeft, setMinLeft] = useState<number | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  const storyId = params.id;

  const loadStory = useCallback(() => {
    setLoading(true);
    setError(false);
    api
      .get<StoryDetail>(`/stories/${storyId}`)
      .then((data) => {
        setStory(data);
        setLikeCount(data.likeCount);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [storyId]);

  const loadLikeStatus = useCallback(() => {
    api
      .get<{ liked: boolean }>(`/stories/${storyId}/liked`)
      .then((data) => setLiked(data.liked))
      .catch(() => {});
  }, [storyId]);

  const loadComments = useCallback(() => {
    api
      .get<Comment[]>(`/stories/${storyId}/comments`)
      .then(setComments)
      .catch(() => {});
  }, [storyId]);

  const loadSidebar = useCallback(() => {
    api
      .get<SidebarStory[]>(`/stories/${storyId}/more-from-author`)
      .then(setMoreFromAuthor)
      .catch(() => {});
    api
      .get<SidebarStory[]>(`/stories/${storyId}/related`)
      .then(setRelated)
      .catch(() => {});
  }, [storyId]);

  useEffect(() => {
    loadStory();
    loadLikeStatus();
    loadComments();
    loadSidebar();
  }, [loadStory, loadLikeStatus, loadComments, loadSidebar]);

  // UX: Init bookmark state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('story-bookmarks');
      if (saved) {
        const set = new Set(JSON.parse(saved));
        setBookmarked(set.has(storyId));
      }
    } catch {
      /* ignore */
    }
  }, [storyId]);

  // UX: Reading position — "X min left" dynamically on scroll
  useEffect(() => {
    if (!story) return;
    const handleScroll = () => {
      const article = articleRef.current;
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const totalHeight = article.scrollHeight;
      const scrolled = Math.max(0, -rect.top);
      const remaining = Math.max(0, totalHeight - scrolled - window.innerHeight);
      const pctLeft = remaining / totalHeight;
      setMinLeft(Math.max(0, Math.round(story.readTime * pctLeft)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [story]);

  const toggleBookmark = useCallback(() => {
    setBookmarked((prev) => {
      const next = !prev;
      try {
        const saved = localStorage.getItem('story-bookmarks');
        const set: Set<string> = saved ? new Set(JSON.parse(saved)) : new Set();
        if (next) set.add(storyId);
        else set.delete(storyId);
        localStorage.setItem('story-bookmarks', JSON.stringify([...set]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [storyId]);

  // UX: Optimistic like/unlike
  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    // Optimistic
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    try {
      if (prevLiked) {
        const res = await api.delete<{ likeCount: number }>(`/stories/${storyId}/like`);
        setLikeCount(res.likeCount);
        setLiked(false);
      } else {
        const res = await api.post<{ likeCount: number }>(`/stories/${storyId}/like`);
        setLikeCount(res.likeCount);
        setLiked(true);
      }
    } catch {
      // Revert optimistic
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const newComment = await api.post<Comment>(`/stories/${storyId}/comments`, {
        content: commentText.trim(),
        parentId: replyTo || undefined,
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setReplyTo(null);
    } catch {
      toast('Failed to post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // UX: Optimistic comment delete
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    const prevComments = comments;
    // Optimistic: remove immediately
    const idsToRemove = new Set<string>();
    idsToRemove.add(commentId);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of comments) {
        if (c.parentId && idsToRemove.has(c.parentId) && !idsToRemove.has(c.id)) {
          idsToRemove.add(c.id);
          changed = true;
        }
      }
    }
    setComments((prev) => prev.filter((c) => !idsToRemove.has(c.id)));

    try {
      await api.delete(`/stories/${storyId}/comments/${commentId}`);
    } catch {
      // Revert on failure
      setComments(prevComments);
      toast('Failed to delete comment', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Skeleton className="h-4 w-20 mb-8" />
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 max-w-[680px] space-y-4">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="hidden lg:block w-64 space-y-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="mb-3">Story not found</p>
        <Link href="/stories" className="text-sm text-primary hover:underline">
          Back to stories
        </Link>
      </div>
    );
  }

  const commentTree = buildCommentTree(comments);
  const headings = extractHeadings(story.content);
  const storyUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      {/* UX: Reading progress bar */}
      <ReadingProgress />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Stories
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main content */}
          <article ref={articleRef} className="flex-1 min-w-0 max-w-[680px]">
            {/* Category */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border mb-4 ${
                CATEGORY_COLORS[story.category] || CATEGORY_COLORS.other
              }`}
            >
              {CATEGORY_LABELS[story.category] || story.category}
            </span>

            {/* Title */}
            <h1 className="text-2xl sm:text-[2rem] font-bold leading-tight tracking-tight mb-6">
              {story.title}
            </h1>

            {/* Author + meta */}
            <div className="flex items-center gap-3 mb-8">
              <Link href={`/${story.author.username}`} className="flex items-center gap-3">
                <Avatar
                  src={story.author.avatarUrl ?? undefined}
                  fallback={story.author.displayName || story.author.username}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium hover:text-primary transition-colors">
                    {story.author.displayName || story.author.username}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{formatDateLong(story.publishedAt)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {story.readTime} min
                    </span>
                    {/* UX: Dynamic "X min left" indicator */}
                    {minLeft !== null && minLeft > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-primary/70">{minLeft} min left</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>

              {story.graph && (
                <Link
                  href={`/${story.author.username}/${story.graph.slug}`}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 border border-border rounded-full px-3 py-1.5"
                >
                  Skill Tree <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* UX: Mobile ToC */}
            <TableOfContents headings={headings} />

            {/* UX: Cover with lightbox */}
            {story.coverUrl && (
              <div
                className="rounded-xl overflow-hidden mb-8 cursor-zoom-in"
                onClick={() => setLightboxSrc(story.coverUrl)}
              >
                <img
                  src={story.coverUrl}
                  alt=""
                  className="w-full max-h-[400px] object-cover transition-transform duration-200 hover:scale-[1.01]"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose-custom">{renderMarkdown(story.content)}</div>

            {/* Tags */}
            {story.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
                {story.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs text-muted-foreground border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Like + comments count */}
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-border">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] border ${
                  liked
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
                }`}
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <Heart
                  className={`w-4 h-4 transition-all ${liked ? 'fill-red-400 scale-110' : ''}`}
                />
                {likeCount}
              </button>

              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                {comments.length}
              </span>
            </div>

            {/* Comments */}
            <div className="mt-10 pt-6 border-t border-border">
              <h2 className="text-base font-semibold mb-6">Comments</h2>

              {user ? (
                <form onSubmit={handleComment} className="mb-8">
                  {replyTo && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <span>Replying to comment</span>
                      <button
                        type="button"
                        onClick={() => setReplyTo(null)}
                        className="text-primary hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Avatar
                      src={user.avatarUrl ?? undefined}
                      fallback={user.displayName || user.username}
                      size="sm"
                    />
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment... (Markdown supported)"
                        className="input-field w-full resize-none text-sm"
                        rows={3}
                        maxLength={2000}
                        aria-label="Comment text"
                      />
                      {/* UX: Character counter */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted">{commentText.length}/2000</span>
                        <button
                          type="submit"
                          disabled={!commentText.trim() || submittingComment}
                          className="btn-primary text-sm px-4 py-1.5"
                        >
                          {submittingComment ? 'Posting...' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{' '}
                  to leave a comment.
                </p>
              )}

              <div className="space-y-0">
                {commentTree.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    userId={user?.id ?? null}
                    onReply={(parentId) => setReplyTo(parentId)}
                    onDelete={handleDeleteComment}
                    depth={0}
                  />
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-muted py-4">No comments yet.</p>
                )}
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-8">
            {/* UX: Table of Contents in sidebar */}
            <TableOfContents headings={headings} />

            {/* UX: Author card */}
            <div className="rounded-xl border border-border p-4">
              <Link href={`/${story.author.username}`} className="flex items-center gap-3 mb-3">
                <Avatar
                  src={story.author.avatarUrl ?? undefined}
                  fallback={story.author.displayName || story.author.username}
                  size="md"
                />
                <div>
                  <p className="text-sm font-medium hover:text-primary transition-colors">
                    {story.author.displayName || story.author.username}
                  </p>
                  <p className="text-xs text-muted">@{story.author.username}</p>
                </div>
              </Link>
              {story.graph && (
                <Link
                  href={`/${story.author.username}/${story.graph.slug}`}
                  className="block text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 flex items-center gap-1"
                >
                  View Skill Tree <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {moreFromAuthor.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                  More from {story.author.displayName || story.author.username}
                </h3>
                <div className="space-y-3">
                  {moreFromAuthor.map((s) => (
                    <Link key={s.id} href={`/stories/${s.id}`} className="block group">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                        {s.title}
                      </p>
                      <span className="text-xs text-muted">{s.readTime} min read</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                  Related
                </h3>
                <div className="space-y-3">
                  {related.map((s) => (
                    <Link key={s.id} href={`/stories/${s.id}`} className="block group">
                      <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                        {s.title}
                      </p>
                      <span className="text-xs text-muted">
                        {s.author && `${s.author.displayName || s.author.username} · `}
                        {s.readTime} min
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* UX: Floating action bar — sticky at bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface border border-border shadow-xl backdrop-blur-sm">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            liked ? 'text-red-400' : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
          {likeCount}
        </button>

        <div className="w-px h-5 bg-border" />

        <button
          onClick={() => {
            document.querySelector('#comments-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Jump to comments"
        >
          <MessageCircle className="w-4 h-4" />
          {comments.length}
        </button>

        <div className="w-px h-5 bg-border" />

        <button
          onClick={() => setShareOpen(true)}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={toggleBookmark}
          className={`p-1.5 rounded-full transition-colors ${
            bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Modals */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={story.title}
        url={storyUrl}
      />

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
