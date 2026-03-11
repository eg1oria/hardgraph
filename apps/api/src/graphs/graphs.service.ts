import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGraphDto } from './dto/create-graph.dto';
import { UpdateGraphDto } from './dto/update-graph.dto';
import slugify from 'slugify';

@Injectable()
export class GraphsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.graph.findMany({
      where: { userId },
      include: { _count: { select: { nodes: true, edges: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findRecentPublic(limit = 20) {
    return this.prisma.graph.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
        _count: { select: { nodes: true, edges: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findById(id: string, userId?: string) {
    const graph = await this.prisma.graph.findUnique({
      where: { id },
      include: {
        nodes: { include: { category: true } },
        edges: true,
        categories: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!graph) throw new NotFoundException('Graph not found');
    if (userId && graph.userId !== userId) throw new ForbiddenException();
    return graph;
  }

  async findPublic(username: string, slug: string) {
    const graph = await this.prisma.graph.findFirst({
      where: {
        slug,
        isPublic: true,
        user: { username },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        nodes: { include: { category: true } },
        edges: true,
        categories: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!graph) throw new NotFoundException('Graph not found');
    return graph;
  }

  async create(userId: string, dto: CreateGraphDto) {
    const baseSlug = slugify(dto.title, { lower: true, strict: true });
    const slug = await this.ensureUniqueSlug(userId, baseSlug);

    return this.prisma.graph.create({
      data: {
        userId,
        title: dto.title,
        slug,
        description: dto.description,
        isPublic: dto.isPublic ?? true,
        theme: dto.theme ?? 'cyberpunk',
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateGraphDto) {
    const graph = await this.findById(id);
    if (graph.userId !== userId) throw new ForbiddenException();

    const data: Record<string, unknown> = { ...dto };
    if (dto.title) {
      data.slug = await this.ensureUniqueSlug(
        userId,
        slugify(dto.title, { lower: true, strict: true }),
        id,
      );
    }

    return this.prisma.graph.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    const graph = await this.findById(id);
    if (graph.userId !== userId) throw new ForbiddenException();
    return this.prisma.graph.delete({ where: { id } });
  }

  private async ensureUniqueSlug(
    userId: string,
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 0;
    const maxAttempts = 100;

    while (counter <= maxAttempts) {
      const existing = await this.prisma.graph.findFirst({
        where: {
          userId,
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
      });
      if (!existing) return slug;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Fallback: append timestamp to guarantee uniqueness
    return `${baseSlug}-${Date.now()}`;
  }
}
