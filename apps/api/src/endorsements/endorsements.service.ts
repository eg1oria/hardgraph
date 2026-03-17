import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';

/** Max anonymous endorsements per graph per IP */
const ANON_LIMIT_PER_GRAPH = 3;

@Injectable()
export class EndorsementsService {
  private readonly logger = new Logger(EndorsementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  async create(
    nodeId: string,
    graphId: string,
    ip: string,
    userId?: string,
  ): Promise<{ endorsementCount: number }> {
    // 1. Validate node exists and belongs to the graph
    const node = await this.prisma.node.findUnique({
      where: { id: nodeId },
      select: { id: true, graphId: true },
    });
    if (!node || node.graphId !== graphId) {
      throw new NotFoundException('Node not found in this graph');
    }

    // 2. Validate graph is public + get owner
    const graph = await this.prisma.graph.findUnique({
      where: { id: graphId },
      select: { id: true, isPublic: true, userId: true },
    });
    if (!graph || !graph.isPublic) {
      throw new NotFoundException('Graph not found');
    }

    // 3. Prevent self-endorsement
    if (userId && userId === graph.userId) {
      throw new ForbiddenException('Cannot endorse your own skill tree');
    }

    const ipHash = createHash('sha256').update(ip).digest('hex');

    // 4. Build dedup data
    const data: Prisma.EndorsementCreateInput = {
      node: { connect: { id: nodeId } },
      graph: { connect: { id: graphId } },
      userId: userId ?? null,
      ipHash: userId ? null : ipHash,
    };

    // 5. Anonymous limit check
    if (!userId) {
      const anonCount = await this.prisma.endorsement.count({
        where: { graphId, ipHash },
      });
      if (anonCount >= ANON_LIMIT_PER_GRAPH) {
        throw new BadRequestException(
          `Anonymous endorsements limited to ${ANON_LIMIT_PER_GRAPH} per graph. Sign in for more.`,
        );
      }
    }

    // 6. Create endorsement + increment counts atomically
    try {
      const [, updatedNode] = await this.prisma.$transaction([
        this.prisma.endorsement.create({ data }),
        this.prisma.node.update({
          where: { id: nodeId },
          data: { endorsementCount: { increment: 1 } },
          select: { endorsementCount: true },
        }),
        this.prisma.graph.update({
          where: { id: graphId },
          data: { endorsementCount: { increment: 1 } },
        }),
      ]);

      this.analytics.trackEvent('endorsement_created', { nodeId, graphId, userId: userId ?? null });

      return { endorsementCount: updatedNode.endorsementCount };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already endorsed this node');
      }
      throw error;
    }
  }

  async getCountsByGraph(graphId: string): Promise<Record<string, number>> {
    const counts = await this.prisma.endorsement.groupBy({
      by: ['nodeId'],
      where: { graphId },
      _count: { id: true },
    });

    const map: Record<string, number> = {};
    for (const row of counts) {
      map[row.nodeId] = row._count.id;
    }
    return map;
  }

  async remove(nodeId: string, userId: string): Promise<{ endorsementCount: number }> {
    const endorsement = await this.prisma.endorsement.findUnique({
      where: { nodeId_userId: { nodeId, userId } },
      select: { id: true, graphId: true },
    });
    if (!endorsement) {
      throw new NotFoundException('Endorsement not found');
    }

    const [, updatedNode] = await this.prisma.$transaction([
      this.prisma.endorsement.delete({ where: { id: endorsement.id } }),
      this.prisma.node.update({
        where: { id: nodeId },
        data: { endorsementCount: { decrement: 1 } },
        select: { endorsementCount: true },
      }),
      this.prisma.graph.update({
        where: { id: endorsement.graphId },
        data: { endorsementCount: { decrement: 1 } },
      }),
    ]);

    return { endorsementCount: Math.max(0, updatedNode.endorsementCount) };
  }

  async getUserEndorsements(graphId: string, userId?: string, ip?: string): Promise<string[]> {
    if (!userId && !ip) return [];

    const where: Prisma.EndorsementWhereInput = { graphId };
    if (userId) {
      where.userId = userId;
    } else {
      where.ipHash = createHash('sha256').update(ip!).digest('hex');
    }

    const endorsements = await this.prisma.endorsement.findMany({
      where,
      select: { nodeId: true },
    });

    return endorsements.map((e) => e.nodeId);
  }
}
