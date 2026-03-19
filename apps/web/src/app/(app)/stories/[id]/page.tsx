'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Clock, ArrowLeft, ExternalLink, Trash2, Reply } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/components/ui/Toast';

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

/** Markdown renderer */
function renderMarkdown(md: string) {
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

      const nextSpecial = remaining.search(/[`*[]/);
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
          className="bg-surface-light rounded-lg p-4 overflow-x-auto my-6 text-sm font-mono border border-border"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={elements.length} className="text-lg font-semibold mt-8 mb-2 text-foreground">
          {inlineFormat(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={elements.length} className="text-xl font-bold mt-10 mb-3 text-foreground">
          {inlineFormat(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={elements.length} className="text-2xl font-bold mt-10 mb-4 text-foreground">
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
          className="list-disc list-inside my-4 space-y-1.5 text-muted-foreground"
        >
          {items}
        </ul>,
      );
      continue;
    }

    if (line.match(/^\d+\. /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i]!.match(/^\d+\. /)) {
        items.push(<li key={items.length}>{inlineFormat(lines[i]!.replace(/^\d+\. /, ''))}</li>);
        i++;
      }
      elements.push(
        <ol
          key={elements.length}
          className="list-decimal list-inside my-4 space-y-1.5 text-muted-foreground"
        >
          {items}
        </ol>,
      );
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i]!.startsWith('> ')) {
        quoteLines.push(lines[i]!.slice(2));
        i++;
      }
      elements.push(
        <blockquote
          key={elements.length}
          className="border-l-2 border-border pl-4 my-6 text-muted-foreground italic"
        >
          {quoteLines.map((ql, idx) => (
            <p key={idx}>{inlineFormat(ql)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    elements.push(
      <p key={elements.length} className="my-4 text-muted-foreground leading-[1.8]">
        {inlineFormat(line)}
      </p>,
    );
    i++;
  }

  return elements;
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
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className={depth > 0 ? 'ml-8 border-l border-border/50 pl-4' : ''}>
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
        <p className="text-sm text-muted-foreground whitespace-pre-wrap ml-7">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1.5 ml-7">
          {userId && depth < 3 && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
          )}
          {userId === comment.authorId && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-muted hover:text-red-400 transition-colors flex items-center gap-1"
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

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      if (liked) {
        const res = await api.delete<{ likeCount: number }>(`/stories/${storyId}/like`);
        setLikeCount(res.likeCount);
        setLiked(false);
      } else {
        const res = await api.post<{ likeCount: number }>(`/stories/${storyId}/like`);
        setLikeCount(res.likeCount);
        setLiked(true);
      }
    } catch {
      // already liked/unliked
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

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/stories/${storyId}/comments/${commentId}`);
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
    } catch {
      toast('Failed to delete comment', 'error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary" />
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/stories"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Stories
      </Link>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main content */}
        <article className="flex-1 min-w-0 max-w-[680px]">
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
                  <span>{formatDate(story.publishedAt)}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {story.readTime} min
                  </span>
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

          {/* Cover */}
          {story.coverUrl && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img src={story.coverUrl} alt="" className="w-full max-h-[400px] object-cover" />
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
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
              {likeCount}
            </button>

            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              {story.commentCount}
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
                      placeholder="Write a comment..."
                      className="input-field w-full resize-none text-sm"
                      rows={3}
                      maxLength={2000}
                    />
                    <div className="flex justify-end mt-2">
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
              {comments.length === 0 && <p className="text-sm text-muted py-4">No comments yet.</p>}
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
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
  );
}
