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
      // Atomic: create view record + increment counter in a single transaction
      await this.prisma.$transaction([
        this.prisma.profileView.create({
          data: {
            graphId,
            viewerIpHash,
            referrer: referrer?.slice(0, 500),
          },
        }),
        this.prisma.graph.update({
          where: { id: graphId },
          data: { viewCount: { increment: 1 } },
        }),
      ]);
    } catch {
      // Silently ignore invalid graphId — don't break the caller
    }
  }

  async getViewsByGraph(graphId: string, userId: string) {
    const graph = await this.prisma.graph.findUnique({ where: { id: graphId } });
    if (!graph || graph.userId !== userId) return null;

    const total = await this.prisma.profileView.count({ where: { graphId } });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Group views by day using raw SQL for proper date truncation
    const last30Days = await this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("viewed_at") as date, COUNT(*)::bigint as count
      FROM profile_views
      WHERE graph_id = ${graphId}::uuid AND viewed_at >= ${thirtyDaysAgo}
      GROUP BY DATE("viewed_at")
      ORDER BY date ASC
    `;

    return {
      total,
      last30Days: last30Days.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
    };
  }
}
