import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEdgeDto } from './dto/create-edge.dto';

@Injectable()
export class EdgesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(graphId: string, userId: string, dto: CreateEdgeDto) {
    await this.verifyGraphOwnership(graphId, userId);

    if (dto.sourceNodeId === dto.targetNodeId) {
      throw new BadRequestException('Cannot create self-referencing edge');
    }

    // Verify both nodes belong to the same graph
    const [sourceNode, targetNode] = await Promise.all([
      this.prisma.node.findUnique({ where: { id: dto.sourceNodeId }, select: { graphId: true } }),
      this.prisma.node.findUnique({ where: { id: dto.targetNodeId }, select: { graphId: true } }),
    ]);

    if (!sourceNode || !targetNode) {
      throw new NotFoundException('One or both nodes not found');
    }
    if (sourceNode.graphId !== graphId || targetNode.graphId !== graphId) {
      throw new BadRequestException('Both nodes must belong to the same graph');
    }

    return this.prisma.edge.create({
      data: { graphId, ...dto },
    });
  }

  async remove(id: string, userId: string) {
    const edge = await this.prisma.edge.findUnique({
      where: { id },
      include: { graph: { select: { userId: true } } },
    });
    if (!edge) throw new NotFoundException('Edge not found');
    if (edge.graph.userId !== userId) throw new ForbiddenException();

    return this.prisma.edge.delete({ where: { id } });
  }

  private async verifyGraphOwnership(graphId: string, userId: string) {
    const graph = await this.prisma.graph.findUnique({ where: { id: graphId } });
    if (!graph) throw new NotFoundException('Graph not found');
    if (graph.userId !== userId) throw new ForbiddenException();
  }
}
