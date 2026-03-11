import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(graphId: string, userId: string, dto: CreateNodeDto) {
    await this.verifyGraphOwnership(graphId, userId);
    return this.prisma.node.create({
      data: {
        graphId,
        name: dto.name,
        description: dto.description,
        level: dto.level,
        nodeType: dto.nodeType,
        icon: dto.icon,
        positionX: dto.positionX,
        positionY: dto.positionY,
        categoryId: dto.categoryId,
        customData: (dto.customData ?? {}) as Prisma.InputJsonValue,
        isUnlocked: dto.isUnlocked,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateNodeDto) {
    const node = await this.prisma.node.findUnique({
      where: { id },
      include: { graph: { select: { userId: true } } },
    });
    if (!node) throw new NotFoundException('Node not found');
    if (node.graph.userId !== userId) throw new ForbiddenException();

    return this.prisma.node.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        level: dto.level,
        nodeType: dto.nodeType,
        icon: dto.icon,
        positionX: dto.positionX,
        positionY: dto.positionY,
        categoryId: dto.categoryId,
        customData: dto.customData !== undefined ? (dto.customData as Prisma.InputJsonValue) : undefined,
        isUnlocked: dto.isUnlocked,
      },
    });
  }

  async remove(id: string, userId: string) {
    const node = await this.prisma.node.findUnique({
      where: { id },
      include: { graph: { select: { userId: true } } },
    });
    if (!node) throw new NotFoundException('Node not found');
    if (node.graph.userId !== userId) throw new ForbiddenException();

    return this.prisma.node.delete({ where: { id } });
  }

  async batchUpdate(userId: string, nodes: { id: string; positionX: number; positionY: number }[]) {
    if (!nodes || nodes.length === 0) return [];
    if (nodes.length > 500) {
      throw new BadRequestException('Batch update limited to 500 nodes');
    }

    const updates = nodes.map((node) =>
      this.prisma.node.updateMany({
        where: {
          id: node.id,
          graph: { userId },
        },
        data: {
          positionX: node.positionX,
          positionY: node.positionY,
        },
      }),
    );
    return this.prisma.$transaction(updates);
  }

  private async verifyGraphOwnership(graphId: string, userId: string) {
    const graph = await this.prisma.graph.findUnique({ where: { id: graphId } });
    if (!graph) throw new NotFoundException('Graph not found');
    if (graph.userId !== userId) throw new ForbiddenException();
  }
}
