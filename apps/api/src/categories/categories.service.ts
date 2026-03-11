import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByGraph(graphId: string) {
    return this.prisma.category.findMany({
      where: { graphId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(graphId: string, userId: string, dto: CreateCategoryDto) {
    await this.verifyGraphOwnership(graphId, userId);
    return this.prisma.category.create({
      data: { graphId, ...dto },
    });
  }

  async update(id: string, userId: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { graph: { select: { userId: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.graph.userId !== userId) throw new ForbiddenException();

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { graph: { select: { userId: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (category.graph.userId !== userId) throw new ForbiddenException();

    return this.prisma.category.delete({ where: { id } });
  }

  private async verifyGraphOwnership(graphId: string, userId: string) {
    const graph = await this.prisma.graph.findUnique({ where: { id: graphId } });
    if (!graph) throw new NotFoundException('Graph not found');
    if (graph.userId !== userId) throw new ForbiddenException();
  }
}
