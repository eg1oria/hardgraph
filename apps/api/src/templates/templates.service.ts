import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.template.findMany({
      orderBy: [{ isFeatured: 'desc' }, { usageCount: 'desc' }],
    });
  }

  async useTemplate(templateId: string, userId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const graphData = template.graphData as {
      nodes?: Array<Record<string, unknown>>;
      edges?: Array<Record<string, unknown>>;
      categories?: Array<Record<string, unknown>>;
    };

    const slug = slugify(template.name, { lower: true, strict: true });

    // All inserts in a single transaction — atomicity + reduced round trips
    const graph = await this.prisma.$transaction(async (tx) => {
      const graph = await tx.graph.create({
        data: {
          userId,
          title: template.name,
          slug: `${slug}-${Date.now()}`,
          description: template.description,
        },
      });

      // 1. Create categories and build old→new ID map
      const categoryMap = new Map<string, string>();
      if (graphData.categories) {
        for (const cat of graphData.categories) {
          const created = await tx.category.create({
            data: {
              graphId: graph.id,
              name: cat.name as string,
              color: cat.color as string | undefined,
              sortOrder: (cat.sortOrder as number) ?? 0,
            },
          });
          categoryMap.set(cat.id as string, created.id);
        }
      }

      // 2. Create nodes and build name→id map (for edges that use source/target names)
      const nodeNameToId = new Map<string, string>();
      if (graphData.nodes) {
        for (const node of graphData.nodes) {
          const catId = node.categoryId
            ? (categoryMap.get(node.categoryId as string) ?? null)
            : null;
          const created = await tx.node.create({
            data: {
              graphId: graph.id,
              name: node.name as string,
              description: (node.description as string) ?? null,
              level: (node.level as string) ?? 'beginner',
              icon: (node.icon as string) ?? null,
              positionX: (node.positionX as number) ?? 0,
              positionY: (node.positionY as number) ?? 0,
              categoryId: catId,
              isUnlocked: (node.isUnlocked as boolean) ?? true,
            },
          });
          nodeNameToId.set(node.name as string, created.id);
        }
      }

      // 3. Create edges in batch (single INSERT instead of N individual inserts)
      if (graphData.edges) {
        const edgeData: Array<{
          graphId: string;
          sourceNodeId: string;
          targetNodeId: string;
          label: string | null;
          edgeType: string;
        }> = [];

        for (const edge of graphData.edges) {
          const sourceId = nodeNameToId.get(edge.source as string);
          const targetId = nodeNameToId.get(edge.target as string);
          if (sourceId && targetId) {
            edgeData.push({
              graphId: graph.id,
              sourceNodeId: sourceId,
              targetNodeId: targetId,
              label: (edge.label as string) ?? null,
              edgeType: (edge.edgeType as string) ?? 'default',
            });
          }
        }

        if (edgeData.length > 0) {
          await tx.edge.createMany({ data: edgeData });
        }
      }

      await tx.template.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      });

      return graph;
    });

    return graph;
  }
}
