import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { EvolveNodeDto } from './dto/evolve-node.dto';

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

  async evolve(id: string, userId: string, dto: EvolveNodeDto) {
    const node = await this.prisma.node.findUnique({
      where: { id },
      include: { graph: { select: { userId: true, id: true } } },
    });
    if (!node) throw new NotFoundException('Node not found');
    if (node.graph.userId !== userId) throw new ForbiddenException();

    // Create evolved node + evolution edge in a transaction
    const [evolvedNode, edge] = await this.prisma.$transaction(async (tx) => {
      const newNode = await tx.node.create({
        data: {
          graphId: node.graphId,
          name: dto.name ?? node.name,
          description: dto.description !== undefined ? dto.description : node.description,
          level: node.level,
          nodeType: node.nodeType,
          icon: node.icon,
          positionX: node.positionX + 250,
          positionY: node.positionY + 100,
          categoryId: node.categoryId,
          customData: node.customData as Prisma.InputJsonValue,
          isUnlocked: node.isUnlocked,
          parentIdeaId: node.id,
        },
      });

      const newEdge = await tx.edge.create({
        data: {
          graphId: node.graphId,
          sourceNodeId: node.id,
          targetNodeId: newNode.id,
          label: 'evolves to',
          edgeType: 'evolution',
        },
      });

      return [newNode, newEdge];
    });

    return { node: evolvedNode, edge };
  }

  async getEvolutionChain(id: string, userId?: string) {
    const node = await this.prisma.node.findUnique({
      where: { id },
      include: { graph: { select: { userId: true, isPublic: true } } },
    });
    if (!node) throw new NotFoundException('Node not found');
    if (!node.graph.isPublic && node.graph.userId !== userId) {
      throw new ForbiddenException();
    }

    // Walk up to find the root ancestor
    let rootId = node.id;
    const visited = new Set<string>([rootId]);
    let currentParentId = node.parentIdeaId;
    while (currentParentId) {
      if (visited.has(currentParentId)) break;
      visited.add(currentParentId);
      const parent = await this.prisma.node.findUnique({
        where: { id: currentParentId },
        select: { id: true, parentIdeaId: true },
      });
      if (!parent) break;
      rootId = parent.id;
      currentParentId = parent.parentIdeaId;
    }

    // Collect the full tree from root (BFS)
    const allNodes = await this.prisma.node.findMany({
      where: { graphId: node.graphId },
      select: {
        id: true,
        name: true,
        description: true,
        level: true,
        nodeType: true,
        icon: true,
        parentIdeaId: true,
        createdAt: true,
      },
    });

    // Build adjacency for children
    const childrenMap = new Map<string, typeof allNodes>();
    for (const n of allNodes) {
      if (n.parentIdeaId) {
        const arr = childrenMap.get(n.parentIdeaId) ?? [];
        arr.push(n);
        childrenMap.set(n.parentIdeaId, arr);
      }
    }

    // BFS from root
    const chain: typeof allNodes = [];
    const queue = [rootId];
    const seen = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (seen.has(current)) continue;
      seen.add(current);
      const n = allNodes.find((x) => x.id === current);
      if (n) {
        chain.push(n);
        const children = childrenMap.get(current) ?? [];
        for (const child of children) {
          queue.push(child.id);
        }
      }
    }

    return { rootId, currentNodeId: id, chain };
  }
}
