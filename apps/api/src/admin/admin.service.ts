import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [usersCount, graphsCount, nodesCount, publicGraphsCount, profileViewsCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.graph.count(),
        this.prisma.node.count(),
        this.prisma.graph.count({ where: { isPublic: true } }),
        this.prisma.profileView.count(),
      ]);

    return { usersCount, graphsCount, nodesCount, publicGraphsCount, profileViewsCount };
  }

  async getUsers(take = 50, skip = 0) {
    return this.prisma.user.findMany({
      take,
      skip,
      select: {
        id: true,
        username: true,
        email: true,
        githubId: true,
        plan: true,
        role: true,
        createdAt: true,
        _count: { select: { graphs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGraphs(take = 50, skip = 0) {
    return this.prisma.graph.findMany({
      take,
      skip,
      select: {
        id: true,
        title: true,
        isPublic: true,
        createdAt: true,
        user: { select: { username: true } },
        _count: { select: { nodes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async deleteGraph(id: string) {
    return this.prisma.graph.delete({ where: { id } });
  }
}
