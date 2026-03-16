import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminQueryDto } from './dto/admin-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateGraphDto } from './dto/update-graph.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      usersCount,
      graphsCount,
      nodesCount,
      publicGraphsCount,
      profileViewsCount,
      templatesCount,
      viewsLast7d,
      viewsLast30d,
      newUsersToday,
      newUsersLast7d,
      activeUsersLast7d,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.graph.count(),
      this.prisma.node.count(),
      this.prisma.graph.count({ where: { isPublic: true } }),
      this.prisma.profileView.count(),
      this.prisma.template.count(),
      this.prisma.profileView.count({ where: { viewedAt: { gte: sevenDaysAgo } } }),
      this.prisma.profileView.count({ where: { viewedAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.graph
        .findMany({
          where: { updatedAt: { gte: sevenDaysAgo } },
          select: { userId: true },
          distinct: ['userId'],
        })
        .then((rows) => rows.length),
    ]);

    return {
      usersCount,
      graphsCount,
      nodesCount,
      publicGraphsCount,
      profileViewsCount,
      templatesCount,
      viewsLast7d,
      viewsLast30d,
      newUsersToday,
      newUsersLast7d,
      activeUsersLast7d,
    };
  }

  async getUsers(query: AdminQueryDto) {
    const take = query.take ?? 20;
    const skip = query.skip ?? 0;
    const order = query.order ?? 'desc';

    const where: Prisma.UserWhereInput = {};
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.role = query.role;
    if (query.plan) where.plan = query.plan;

    let orderBy: Prisma.UserOrderByWithRelationInput;
    switch (query.sortBy) {
      case 'username':
        orderBy = { username: order };
        break;
      case 'graphs':
        orderBy = { graphs: { _count: order } };
        break;
      default:
        orderBy = { createdAt: order };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take,
        skip,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          githubId: true,
          githubUsername: true,
          plan: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { graphs: true } },
        },
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  async getGraphs(query: AdminQueryDto) {
    const take = query.take ?? 20;
    const skip = query.skip ?? 0;
    const order = query.order ?? 'desc';

    const where: Prisma.GraphWhereInput = {};
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    if (query.isPublic !== undefined) {
      where.isPublic = query.isPublic === 'true';
    }

    let orderBy: Prisma.GraphOrderByWithRelationInput;
    switch (query.sortBy) {
      case 'title':
        orderBy = { title: order };
        break;
      case 'viewCount':
        orderBy = { viewCount: order };
        break;
      default:
        orderBy = { createdAt: order };
    }

    const [data, total] = await Promise.all([
      this.prisma.graph.findMany({
        where,
        take,
        skip,
        select: {
          id: true,
          title: true,
          slug: true,
          isPublic: true,
          viewCount: true,
          forkCount: true,
          createdAt: true,
          user: { select: { id: true, username: true } },
          _count: { select: { nodes: true, edges: true, categories: true } },
        },
        orderBy,
      }),
      this.prisma.graph.count({ where }),
    ]);

    return { data, total };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        githubId: true,
        githubUsername: true,
        role: true,
        plan: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
        graphs: {
          select: {
            id: true,
            title: true,
            slug: true,
            isPublic: true,
            viewCount: true,
            createdAt: true,
            _count: { select: { nodes: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const totalViews = user.graphs.reduce((sum, g) => sum + g.viewCount, 0);
    return { ...user, totalViews };
  }

  async getGraphById(id: string) {
    const graph = await this.prisma.graph.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        isPublic: true,
        isPrimary: true,
        theme: true,
        viewCount: true,
        forkCount: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { nodes: true, edges: true, categories: true } },
      },
    });
    if (!graph) throw new NotFoundException('Graph not found');
    return graph;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        plan: true,
        bio: true,
      },
    });
  }

  async updateGraph(id: string, dto: UpdateGraphDto) {
    const graph = await this.prisma.graph.findUnique({ where: { id }, select: { id: true } });
    if (!graph) throw new NotFoundException('Graph not found');

    return this.prisma.graph.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        title: true,
        description: true,
        isPublic: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.delete({ where: { id } });
  }

  async deleteGraph(id: string) {
    const graph = await this.prisma.graph.findUnique({ where: { id }, select: { id: true } });
    if (!graph) throw new NotFoundException('Graph not found');
    return this.prisma.graph.delete({ where: { id } });
  }

  // ── Templates ──

  async getTemplates() {
    return this.prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        name: dto.name,
        description: dto.description,
        field: dto.field,
        graphData: dto.graphData as Prisma.InputJsonValue,
        isFeatured: dto.isFeatured ?? false,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const tpl = await this.prisma.template.findUnique({ where: { id }, select: { id: true } });
    if (!tpl) throw new NotFoundException('Template not found');

    const data: Prisma.TemplateUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.field !== undefined) data.field = dto.field;
    if (dto.graphData !== undefined) data.graphData = dto.graphData as Prisma.InputJsonValue;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;

    return this.prisma.template.update({ where: { id }, data });
  }

  async deleteTemplate(id: string) {
    const tpl = await this.prisma.template.findUnique({ where: { id }, select: { id: true } });
    if (!tpl) throw new NotFoundException('Template not found');
    return this.prisma.template.delete({ where: { id } });
  }

  // ── Analytics ──

  async getAnalyticsSummary() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [viewsPerDay, topGraphs, topReferrers, topCountries] = await Promise.all([
      this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("viewed_at") as date, COUNT(*)::bigint as count
        FROM profile_views
        WHERE "viewed_at" >= ${thirtyDaysAgo}
        GROUP BY DATE("viewed_at")
        ORDER BY date ASC
      `,
      this.prisma.graph.findMany({
        where: { viewCount: { gt: 0 } },
        select: {
          id: true,
          title: true,
          viewCount: true,
          user: { select: { username: true } },
        },
        orderBy: { viewCount: 'desc' },
        take: 10,
      }),
      this.prisma.$queryRaw<Array<{ referrer: string; count: bigint }>>`
        SELECT referrer, COUNT(*)::bigint as count
        FROM profile_views
        WHERE referrer IS NOT NULL AND "viewed_at" >= ${thirtyDaysAgo}
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      `,
      this.prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
        SELECT country, COUNT(*)::bigint as count
        FROM profile_views
        WHERE country IS NOT NULL AND "viewed_at" >= ${thirtyDaysAgo}
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

    return {
      viewsPerDay: viewsPerDay.map((r) => ({ date: r.date, count: Number(r.count) })),
      topGraphs,
      topReferrers: topReferrers.map((r) => ({ referrer: r.referrer, count: Number(r.count) })),
      topCountries: topCountries.map((r) => ({ country: r.country, count: Number(r.count) })),
    };
  }

  async getUserGrowth() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("created_at") as date, COUNT(*)::bigint as count
      FROM users
      WHERE "created_at" >= ${thirtyDaysAgo}
      GROUP BY DATE("created_at")
      ORDER BY date ASC
    `;

    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  // ── Recent items for dashboard ──

  async getRecentUsers(limit = 5) {
    return this.prisma.user.findMany({
      take: limit,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentGraphs(limit = 5) {
    return this.prisma.graph.findMany({
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        user: { select: { username: true } },
        _count: { select: { nodes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
