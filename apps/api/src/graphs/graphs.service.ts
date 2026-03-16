import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateGraphDto } from './dto/create-graph.dto';
import { UpdateGraphDto } from './dto/update-graph.dto';
import { ForkGraphDto } from './dto/fork-graph.dto';
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

  async findRecentPublic(limit = 20, skip = 0) {
    return this.prisma.graph.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
        _count: { select: { nodes: true, edges: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50),
      skip,
    });
  }

  async findById(id: string, userId?: string) {
    const graph = await this.prisma.graph.findUnique({
      where: { id },
      include: {
        nodes: { include: { category: true } },
        edges: true,
        categories: { orderBy: { sortOrder: 'asc' } },
        forkedFrom: {
          select: {
            id: true,
            slug: true,
            title: true,
            user: { select: { username: true } },
          },
        },
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
        forkedFrom: {
          select: {
            id: true,
            slug: true,
            title: true,
            user: { select: { username: true } },
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

    try {
      return await this.prisma.graph.create({
        data: {
          userId,
          title: dto.title,
          slug,
          description: dto.description,
          isPublic: dto.isPublic ?? true,
          theme: dto.theme ?? 'cyberpunk',
        },
      });
    } catch (error) {
      // Retry once on unique constraint violation (slug race condition)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const retrySlug = `${baseSlug}-${Date.now()}`;
        return this.prisma.graph.create({
          data: {
            userId,
            title: dto.title,
            slug: retrySlug,
            description: dto.description,
            isPublic: dto.isPublic ?? true,
            theme: dto.theme ?? 'cyberpunk',
          },
        });
      }
      throw error;
    }
  }

  async update(id: string, userId: string, dto: UpdateGraphDto) {
    await this.verifyOwnership(id, userId);

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
    await this.verifyOwnership(id, userId);
    return this.prisma.graph.delete({ where: { id } });
  }

  /** Lightweight ownership check — does NOT load nodes/edges/categories */
  private async verifyOwnership(id: string, userId: string) {
    const graph = await this.prisma.graph.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!graph) throw new NotFoundException('Graph not found');
    if (graph.userId !== userId) throw new ForbiddenException();
  }

  private async ensureUniqueSlug(
    userId: string,
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    // Single query: fetch all slugs matching the base pattern
    const existing = await this.prisma.graph.findMany({
      where: {
        userId,
        slug: { startsWith: baseSlug },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { slug: true },
    });

    const existingSlugs = new Set(existing.map((g) => g.slug));
    if (!existingSlugs.has(baseSlug)) return baseSlug;

    for (let i = 1; i <= 100; i++) {
      const candidate = `${baseSlug}-${i}`;
      if (!existingSlugs.has(candidate)) return candidate;
    }

    // Fallback: append timestamp to guarantee uniqueness
    return `${baseSlug}-${Date.now()}`;
  }

  async forkGraph(sourceGraphId: string, userId: string, dto: ForkGraphDto) {
    const sourceGraph = await this.prisma.graph.findUnique({
      where: { id: sourceGraphId },
      include: {
        nodes: { include: { category: true } },
        edges: true,
        categories: { orderBy: { sortOrder: 'asc' } },
        user: { select: { username: true } },
      },
    });

    if (!sourceGraph) throw new NotFoundException('Graph not found');
    if (!sourceGraph.isPublic) throw new ForbiddenException('Cannot fork a private graph');
    if (sourceGraph.userId === userId) throw new ForbiddenException('Cannot fork your own graph');

    const title = (dto.title?.trim() || `${sourceGraph.title} (fork)`).slice(0, 200);
    const includeEdges = dto.includeEdges !== false;

    const slug = await this.ensureUniqueSlug(
      userId,
      slugify(title, { lower: true, strict: true }),
    );

    const newGraph = await this.prisma.$transaction(async (tx) => {
      const created = await tx.graph.create({
        data: {
          userId,
          title,
          slug,
          description: sourceGraph.description,
          isPublic: true,
          theme: sourceGraph.theme,
          forkedFromId: sourceGraph.id,
        },
      });

      // Copy categories
      const categoryMap = new Map<string, string>();
      for (const cat of sourceGraph.categories) {
        const newCat = await tx.category.create({
          data: {
            graphId: created.id,
            name: cat.name,
            color: cat.color,
            sortOrder: cat.sortOrder,
          },
        });
        categoryMap.set(cat.id, newCat.id);
      }

      // Copy nodes
      const nodeMap = new Map<string, string>();
      for (const node of sourceGraph.nodes) {
        const newCatId = node.categoryId
          ? (categoryMap.get(node.categoryId) ?? null)
          : null;
        const newNode = await tx.node.create({
          data: {
            graphId: created.id,
            name: node.name,
            description: node.description,
            level: node.level,
            nodeType: node.nodeType,
            icon: node.icon,
            positionX: node.positionX,
            positionY: node.positionY,
            customData: (node.customData as object) ?? {},
            isUnlocked: node.isUnlocked,
            categoryId: newCatId,
          },
        });
        nodeMap.set(node.id, newNode.id);
      }

      // Copy edges
      if (includeEdges && sourceGraph.edges.length > 0) {
        const edgeData = sourceGraph.edges
          .map((edge) => {
            const newSource = nodeMap.get(edge.sourceNodeId);
            const newTarget = nodeMap.get(edge.targetNodeId);
            if (!newSource || !newTarget) return null;
            return {
              graphId: created.id,
              sourceNodeId: newSource,
              targetNodeId: newTarget,
              label: edge.label,
              edgeType: edge.edgeType,
            };
          })
          .filter(Boolean) as Array<{
            graphId: string;
            sourceNodeId: string;
            targetNodeId: string;
            label: string | null;
            edgeType: string;
          }>;

        if (edgeData.length > 0) {
          await tx.edge.createMany({ data: edgeData });
        }
      }

      // Increment fork count on source
      await tx.graph.update({
        where: { id: sourceGraph.id },
        data: { forkCount: { increment: 1 } },
      });

      return created;
    });

    return { id: newGraph.id, slug: newGraph.slug };
  }
}
