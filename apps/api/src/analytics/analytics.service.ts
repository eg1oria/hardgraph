import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackView(graphId: string, ip: string, referrer?: string) {
    // Validate graphId exists and is public before tracking
    const graph = await this.prisma.graph.findUnique({
      where: { id: graphId },
      select: { id: true, isPublic: true },
    });
    if (!graph || !graph.isPublic) return;

    const viewerIpHash = createHash('sha256').update(ip).digest('hex');

    try {
      await this.prisma.profileView.create({
        data: {
          graphId,
          viewerIpHash,
          referrer: referrer?.slice(0, 500),
        },
      });

      await this.prisma.graph.update({
        where: { id: graphId },
        data: { viewCount: { increment: 1 } },
      });
    } catch {
      // Silently ignore invalid graphId — don't break the caller
    }
  }

  async getViewsByGraph(graphId: string, userId: string) {
    const graph = await this.prisma.graph.findUnique({ where: { id: graphId } });
    if (!graph || graph.userId !== userId) return null;

    const total = await this.prisma.profileView.count({ where: { graphId } });

    const last30Days = await this.prisma.profileView.groupBy({
      by: ['viewedAt'],
      where: {
        graphId,
        viewedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: true,
    });

    return { total, last30Days };
  }
}
