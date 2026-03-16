import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

/** Minimum interval (ms) between two counted views from the same viewer on the same graph */
const VIEW_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  async trackView(
    graphId: string,
    ip: string,
    referrer?: string,
    viewerUserId?: string,
  ): Promise<{ counted: boolean; viewCount: number }> {
    // 1. Validate graph exists and is public
    const graph = await this.prisma.graph.findUnique({
      where: { id: graphId },
      select: { id: true, isPublic: true, userId: true, viewCount: true },
    });
    if (!graph || !graph.isPublic) {
      return { counted: false, viewCount: graph?.viewCount ?? 0 };
    }

    // 2. Self-view: don't count if the viewer is the graph owner
    if (viewerUserId && viewerUserId === graph.userId) {
      return { counted: false, viewCount: graph.viewCount };
    }

    // 3. Skip if IP could not be determined — a single hash for all visitors breaks dedup
    if (!ip || ip === 'unknown' || ip === '::1') {
      this.logger.warn(`Skipping view track for graph ${graphId}: invalid IP "${ip}"`);
      return { counted: false, viewCount: graph.viewCount };
    }

    const viewerIpHash = createHash('sha256').update(ip).digest('hex');

    // 3. Deduplication: check for a recent view from the same IP on the same graph
    const cooldownThreshold = new Date(Date.now() - VIEW_COOLDOWN_MS);
    const recentView = await this.prisma.profileView.findFirst({
      where: {
        graphId,
        viewerIpHash,
        viewedAt: { gte: cooldownThreshold },
      },
      select: { id: true },
    });

    if (recentView) {
      return { counted: false, viewCount: graph.viewCount };
    }

    // 4. Record view + atomic increment in a single transaction
    try {
      const [, updatedGraph] = await this.prisma.$transaction([
        this.prisma.profileView.create({
          data: {
            graphId,
            viewerIpHash,
            viewerUserId: viewerUserId ?? null,
            referrer: referrer?.slice(0, 500),
          },
        }),
        this.prisma.graph.update({
          where: { id: graphId },
          data: { viewCount: { increment: 1 } },
          select: { viewCount: true },
        }),
      ]);

      return { counted: true, viewCount: updatedGraph.viewCount };
    } catch (error) {
      this.logger.warn(
        `Failed to track view for graph ${graphId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return { counted: false, viewCount: graph.viewCount };
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

  constructor(private readonly prisma: PrismaService) {}
}
