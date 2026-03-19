import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

const LEVEL_WEIGHT: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const LEVEL_ORDER: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

function isValidLevel(level: string): level is SkillLevel {
  return LEVEL_ORDER.includes(level as SkillLevel);
}

interface VacancySkill {
  name: string;
  level: string;
  category?: string;
  categoryColor?: string;
}

@Injectable()
export class VacanciesService {
  private readonly logger = new Logger(VacanciesService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async findAll(field?: string, search?: string) {
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
    return this.prisma.vacancy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
  }

  async findMine(userId: string) {
    return this.prisma.vacancy.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { id },
      include: {
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
  async compareWithGraph(vacancyId: string, graphId: string) {
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
    if (!graph.isPublic) throw new ForbiddenException('This graph is private');

    const vacancySkills = (vacancy.skills as unknown as VacancySkill[]) ?? [];

    // Build candidate skill map: lowercase name → { level, category }
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

    // Perform matching
    const skills: Array<{
      name: string;
      category?: string;
      categoryColor?: string;
      candidateLevel: string | null;
      requiredLevel: string;
      status: 'matched' | 'upgrade' | 'missing';
    }> = [];

    let totalScore = 0;
    let maxPossibleScore = 0;
    let matchedCount = 0;
    let upgradeCount = 0;
    let missingCount = 0;

    // Category breakdown tracking
    const categoryStats = new Map<
      string,
      { color: string; matched: number; total: number; score: number; maxScore: number }
    >();

    for (const reqSkill of vacancySkills) {
      const reqLevel: SkillLevel = isValidLevel(reqSkill.level) ? reqSkill.level : 'beginner';
      const weight = LEVEL_WEIGHT[reqLevel];
      maxPossibleScore += weight;

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
          totalScore += weight;
          catStat.score += weight;
          catStat.matched++;
          matchedCount++;
          skills.push({
            name: reqSkill.name,
            category: reqSkill.category ?? candidateSkill.category,
            categoryColor: reqSkill.categoryColor ?? candidateSkill.categoryColor,
            candidateLevel: candLevel,
            requiredLevel: reqLevel,
            status: 'matched',
          });
        } else {
          const partialScore = LEVEL_WEIGHT[candLevel] * 0.5;
          totalScore += partialScore;
          catStat.score += partialScore;
          upgradeCount++;
          skills.push({
            name: reqSkill.name,
            category: reqSkill.category ?? candidateSkill.category,
            categoryColor: reqSkill.categoryColor ?? candidateSkill.categoryColor,
            candidateLevel: candLevel,
            requiredLevel: reqLevel,
            status: 'upgrade',
          });
        }
      } else {
        missingCount++;
        skills.push({
          name: reqSkill.name,
          category: reqSkill.category,
          categoryColor: reqSkill.categoryColor,
          candidateLevel: null,
          requiredLevel: reqLevel,
          status: 'missing',
        });
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

    const matchScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    return {
      vacancyId: vacancy.id,
      vacancyTitle: vacancy.title,
      graphId: graph.id,
      graphTitle: graph.title,
      candidateUsername: graph.user.username,
      candidateDisplayName: graph.user.displayName,
      candidateAvatarUrl: graph.user.avatarUrl,
      matchScore,
      totalRequired: vacancySkills.length,
      matchedCount,
      upgradeCount,
      missingCount,
      bonusCount: bonusSkills.length,
      skills,
      bonusSkills,
      categoryBreakdown,
    };
  }
}
