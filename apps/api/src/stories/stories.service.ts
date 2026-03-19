import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Generate slug from title */
  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200);
  }

  /** Calculate read time from content (words / 200) */
  private calcReadTime(content: string): number {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  /** Ensure unique slug for author */
  private async ensureUniqueSlug(
    authorId: string,
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    const slug = baseSlug || 'untitled';
    for (let i = 0; i < 100; i++) {
      const candidate = i === 0 ? slug : `${slug}-${i}`;
      const existing = await this.prisma.story.findUnique({
        where: { authorId_slug: { authorId, slug: candidate } },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) return candidate;
    }
    return `${slug}-${Date.now()}`;
  }

  async create(dto: CreateStoryDto, authorId: string) {
    const slug = await this.ensureUniqueSlug(authorId, this.slugify(dto.title));
    const readTime = this.calcReadTime(dto.content);

    return this.prisma.story.create({
      data: {
        authorId,
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt || null,
        coverUrl: dto.coverUrl || null,
        category: dto.category,
        tags: dto.tags || [],
        field: dto.field || null,
        readTime,
        graphId: dto.graphId || null,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateStoryDto, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      select: { id: true, authorId: true, slug: true },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) throw new ForbiddenException('Not the author');

    const data: Prisma.StoryUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = await this.ensureUniqueSlug(userId, this.slugify(dto.title), id);
    }
    if (dto.content !== undefined) {
      data.content = dto.content;
      data.readTime = this.calcReadTime(dto.content);
    }
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt || null;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl || null;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.field !== undefined) data.field = dto.field || null;
    if (dto.graphId !== undefined) {
      data.graph = dto.graphId ? { connect: { id: dto.graphId } } : { disconnect: true };
    }

    return this.prisma.story.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) throw new ForbiddenException('Not the author');

    await this.prisma.story.delete({ where: { id } });
    return { deleted: true };
  }

  async publish(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      select: { id: true, authorId: true, isPublished: true },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) throw new ForbiddenException('Not the author');

    return this.prisma.story.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: story.isPublished ? undefined : new Date(),
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        graph: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (!story.isPublished) throw new NotFoundException('Story not found');
    return story;
  }

  async findOneForAuthor(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        graph: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) throw new ForbiddenException('Not the author');
    return story;
  }

  /** Lightweight published check for internal use (sidebar queries) */
  async findPublished(id: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      select: { id: true, authorId: true, category: true, field: true, isPublished: true },
    });
    if (!story || !story.isPublished) throw new NotFoundException('Story not found');
    return story;
  }

  async incrementView(id: string, _ip: string) {
    await this.prisma.story.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async findMyStories(userId: string) {
    return this.prisma.story.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  async feed(params: {
    category?: string;
    field?: string;
    tag?: string;
    sort?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }) {
    const { category, field, tag, sort = 'recent', search, skip = 0, limit = 20 } = params;
    const take = Math.min(limit, 50);

    const where: Prisma.StoryWhereInput = { isPublished: true };
    if (category) where.category = category;
    if (field) where.field = field;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { tags: { has: search } }];
    }

    let orderBy: Prisma.StoryOrderByWithRelationInput;
    switch (sort) {
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'most_liked':
        orderBy = { likeCount: 'desc' };
        break;
      default:
        orderBy = { publishedAt: 'desc' };
    }

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.story.count({ where }),
    ]);

    return { stories, total, skip, limit: take };
  }

  // ===== LIKES =====

  async like(storyId: string, ip: string, userId?: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, isPublished: true },
    });
    if (!story || !story.isPublished) throw new NotFoundException('Story not found');

    const ipHash = createHash('sha256').update(ip).digest('hex');

    const data: Prisma.StoryLikeCreateInput = {
      story: { connect: { id: storyId } },
      userId: userId ?? null,
      ipHash: userId ? null : ipHash,
    };

    try {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.storyLike.create({ data }),
        this.prisma.story.update({
          where: { id: storyId },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        }),
      ]);
      return { likeCount: updated.likeCount, liked: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Already liked');
      }
      throw error;
    }
  }

  async unlike(storyId: string, ip: string, userId?: string) {
    const ipHash = createHash('sha256').update(ip).digest('hex');

    let like;
    if (userId) {
      like = await this.prisma.storyLike.findUnique({
        where: { storyId_userId: { storyId, userId } },
      });
    } else {
      like = await this.prisma.storyLike.findUnique({
        where: { storyId_ipHash: { storyId, ipHash } },
      });
    }

    if (!like) throw new NotFoundException('Like not found');

    const [, updated] = await this.prisma.$transaction([
      this.prisma.storyLike.delete({ where: { id: like.id } }),
      this.prisma.story.update({
        where: { id: storyId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      }),
    ]);

    return { likeCount: Math.max(0, updated.likeCount), liked: false };
  }

  async hasLiked(storyId: string, ip: string, userId?: string): Promise<boolean> {
    const ipHash = createHash('sha256').update(ip).digest('hex');
    if (userId) {
      const like = await this.prisma.storyLike.findUnique({
        where: { storyId_userId: { storyId, userId } },
      });
      return !!like;
    }
    const like = await this.prisma.storyLike.findUnique({
      where: { storyId_ipHash: { storyId, ipHash } },
    });
    return !!like;
  }

  // ===== COMMENTS =====

  async getComments(storyId: string) {
    const comments = await this.prisma.storyComment.findMany({
      where: { storyId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        authorId: true,
        storyId: true,
      },
    });

    // Fetch unique author IDs
    const authorIds: string[] = [...new Set(comments.map((c: { authorId: string }) => c.authorId))];
    const authors = await this.prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });
    const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));

    return comments.map(
      (c: {
        id: string;
        content: string;
        parentId: string | null;
        createdAt: Date;
        authorId: string;
        storyId: string;
      }) => ({
        ...c,
        author: authorMap[c.authorId] || null,
      }),
    );
  }

  async addComment(storyId: string, authorId: string, content: string, parentId?: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, isPublished: true },
    });
    if (!story || !story.isPublished) throw new NotFoundException('Story not found');

    if (parentId) {
      const parent = await this.prisma.storyComment.findUnique({
        where: { id: parentId },
        select: { id: true, storyId: true },
      });
      if (!parent || parent.storyId !== storyId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.storyComment.create({
        data: { storyId, authorId, content, parentId: parentId || null },
      }),
      this.prisma.story.update({
        where: { id: storyId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    return { ...comment, author };
  }

  async removeComment(commentId: string, userId: string) {
    const comment = await this.prisma.storyComment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, storyId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Not the comment author');

    // Count replies that will be cascade-deleted
    const replyCount = await this.prisma.storyComment.count({
      where: { parentId: commentId },
    });

    await this.prisma.$transaction([
      this.prisma.storyComment.delete({ where: { id: commentId } }),
      this.prisma.story.update({
        where: { id: comment.storyId },
        data: { commentCount: { decrement: 1 + replyCount } },
      }),
    ]);

    return { deleted: true };
  }

  /** Get more stories from the same author */
  async getMoreFromAuthor(storyId: string, authorId: string, limit = 3) {
    return this.prisma.story.findMany({
      where: { authorId, isPublished: true, id: { not: storyId } },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: { id: true, title: true, category: true, readTime: true, publishedAt: true },
    });
  }

  /** Get related stories by field/category */
  async getRelated(storyId: string, category: string, field: string | null, limit = 3) {
    return this.prisma.story.findMany({
      where: {
        isPublished: true,
        id: { not: storyId },
        OR: [{ category }, ...(field ? [{ field }] : [])],
      },
      orderBy: { likeCount: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        readTime: true,
        publishedAt: true,
        author: {
          select: { username: true, displayName: true },
        },
      },
    });
  }
}
