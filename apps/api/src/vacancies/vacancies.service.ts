import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import {
  SkillLevel,
  LEVEL_WEIGHT,
  isValidLevel,
  computeMatchScore,
  VacancySkill,
} from '../common/utils/skill-matcher';

@Injectable()
export class VacanciesService {
  private readonly logger = new Logger(VacanciesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateVacancyDto) {
    return this.prisma.vacancy.create({
      data: {
        authorId: userId,
        title: dto.title,
        company: dto.company,
        description: dto.description,
        field: dto.field,
        location: dto.location,
        salaryRange: dto.salaryRange,
        skills: dto.skills as unknown as Prisma.JsonArray,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(field?: string, search?: string, page = 1, limit = 20) {
    const where: Prisma.VacancyWhereInput = { isActive: true };
    if (field) {
      where.field = { equals: field, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.vacancy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          company: true,
          description: true,
          field: true,
          location: true,
          salaryRange: true,
          skills: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.vacancy.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMine(userId: string) {
    return this.prisma.vacancy.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        field: true,
        location: true,
        salaryRange: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { applications: true } },
      },
    });
  }

  async findOne(id: string) {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        title: true,
        company: true,
        description: true,
        field: true,
        location: true,
        salaryRange: true,
        skills: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    return vacancy;
  }

  async update(id: string, userId: string, dto: UpdateVacancyDto) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    if (vacancy.authorId !== userId)
      throw new ForbiddenException('You can only edit your own vacancies');

    return this.prisma.vacancy.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.field !== undefined && { field: dto.field }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.salaryRange !== undefined && { salaryRange: dto.salaryRange }),
        ...(dto.skills !== undefined && { skills: dto.skills as unknown as Prisma.JsonArray }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string, userId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    if (vacancy.authorId !== userId)
      throw new ForbiddenException('You can only delete your own vacancies');

    await this.prisma.vacancy.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Compare a vacancy's skill requirements against a public graph.
   * Returns gap analysis result from the HR perspective:
   * "How well does this candidate match our requirements?"
   */
  async compareWithGraph(vacancyId: string, graphId: string, userId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');

    const graph = await this.prisma.graph.findUnique({
      where: { id: graphId },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublic: true,
        userId: true,
        user: { select: { username: true, displayName: true, avatarUrl: true } },
        nodes: {
          select: {
            name: true,
            level: true,
            icon: true,
            categoryId: true,
            category: { select: { name: true, color: true } },
          },
        },
      },
    });

    if (!graph) throw new NotFoundException('Graph not found');
    // Allow if graph is public, user owns the graph, or user owns the vacancy
    if (!graph.isPublic && graph.userId !== userId && vacancy.authorId !== userId) {
      throw new ForbiddenException('This graph is private');
    }

    const vacancySkills = (vacancy.skills as unknown as VacancySkill[]) ?? [];

    // Build candidate node map for enrichment (category from graph)
    const candidateMap = new Map<
      string,
      { level: string; icon?: string; category?: string; categoryColor?: string }
    >();
    for (const node of graph.nodes) {
      candidateMap.set(node.name.toLowerCase(), {
        level: node.level,
        icon: node.icon ?? undefined,
        category: node.category?.name,
        categoryColor: node.category?.color ?? undefined,
      });
    }

    // Core matching via shared utility
    const match = computeMatchScore(vacancySkills, graph.nodes);

    // Enrich details with candidate's category info from graph nodes
    const skills = match.details.map((d) => {
      const cand = candidateMap.get(d.name.toLowerCase());
      return {
        ...d,
        category: d.category ?? cand?.category,
        categoryColor: d.categoryColor ?? cand?.categoryColor,
      };
    });

    // Category breakdown tracking
    const categoryStats = new Map<
      string,
      { color: string; matched: number; total: number; score: number; maxScore: number }
    >();

    for (const reqSkill of vacancySkills) {
      const reqLevel: SkillLevel = isValidLevel(reqSkill.level) ? reqSkill.level : 'beginner';
      const weight = LEVEL_WEIGHT[reqLevel];

      const catKey = reqSkill.category ?? 'General';
      const catColor = reqSkill.categoryColor ?? '#6B7280';
      if (!categoryStats.has(catKey)) {
        categoryStats.set(catKey, { color: catColor, matched: 0, total: 0, score: 0, maxScore: 0 });
      }
      const catStat = categoryStats.get(catKey)!;
      catStat.total++;
      catStat.maxScore += weight;

      const candidateSkill = candidateMap.get(reqSkill.name.toLowerCase());
      if (candidateSkill) {
        const candLevel: SkillLevel = isValidLevel(candidateSkill.level)
          ? candidateSkill.level
          : 'beginner';
        if (LEVEL_WEIGHT[candLevel] >= LEVEL_WEIGHT[reqLevel]) {
          catStat.score += weight;
          catStat.matched++;
        } else {
          catStat.score += LEVEL_WEIGHT[candLevel] * 0.5;
        }
      }
    }

    // Bonus skills (candidate has, vacancy doesn't require)
    const requiredNames = new Set(vacancySkills.map((s) => s.name.toLowerCase()));
    const bonusSkills = graph.nodes
      .filter((n) => !requiredNames.has(n.name.toLowerCase()))
      .map((n) => ({
        name: n.name,
        level: n.level,
        category: n.category?.name,
      }));

    // Category breakdown
    const categoryBreakdown = Array.from(categoryStats.entries()).map(([name, stat]) => ({
      name,
      color: stat.color,
      matchScore: stat.maxScore > 0 ? Math.round((stat.score / stat.maxScore) * 100) : 0,
      matched: stat.matched,
      total: stat.total,
    }));

    return {
      vacancyId: vacancy.id,
      vacancyTitle: vacancy.title,
      graphId: graph.id,
      graphSlug: graph.slug,
      graphTitle: graph.title,
      candidateUsername: graph.user.username,
      candidateDisplayName: graph.user.displayName,
      candidateAvatarUrl: graph.user.avatarUrl,
      matchScore: match.matchScore,
      totalRequired: match.totalRequired,
      matchedCount: match.matchedCount,
      upgradeCount: match.upgradeCount,
      missingCount: match.missingCount,
      bonusCount: bonusSkills.length,
      skills,
      bonusSkills,
      categoryBreakdown,
    };
  }

  async aiAnalyze(vacancyId: string, graphId: string, userId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');

    const graph = await this.prisma.graph.findUnique({
      where: { id: graphId },
      select: {
        id: true,
        isPublic: true,
        userId: true,
        nodes: {
          select: {
            name: true,
            level: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    if (!graph) throw new NotFoundException('Graph not found');
    if (!graph.isPublic && graph.userId !== userId && vacancy.authorId !== userId) {
      throw new ForbiddenException('This graph is private');
    }

    const vacancySkills = (vacancy.skills as unknown as VacancySkill[]) ?? [];
    const match = computeMatchScore(vacancySkills, graph.nodes);

    const candidateSkills = graph.nodes.map((n) => ({
      name: n.name,
      level: n.level,
      category: n.category?.name,
    }));

    const aiAnalysis = await this.aiService.analyzeVacancyMatch({
      vacancy: {
        title: vacancy.title,
        company: vacancy.company ?? undefined,
        description: vacancy.description ?? undefined,
        field: vacancy.field ?? undefined,
        location: vacancy.location ?? undefined,
        skills: vacancySkills.map((s) => ({
          name: s.name,
          level: s.level,
          category: s.category,
        })),
      },
      candidateSkills,
      algorithmicMatchScore: match.matchScore,
      matchedCount: match.matchedCount,
      totalRequired: match.totalRequired,
    });

    return {
      algorithmicMatch: {
        matchScore: match.matchScore,
        matchedCount: match.matchedCount,
        totalRequired: match.totalRequired,
      },
      aiAnalysis,
    };
  }
}
