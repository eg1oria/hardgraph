import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateGraphDto } from './dto/create-graph.dto';
import { UpdateGraphDto } from './dto/update-graph.dto';
import { ForkGraphDto } from './dto/fork-graph.dto';
import { ScanService } from '../scan/scan.service';
import {
  computeMatchScore,
  VacancySkill,
  isValidLevel,
  LEVEL_WEIGHT,
  SkillLevel,
} from '../common/utils/skill-matcher';
import slugify from 'slugify';

@Injectable()
export class GraphsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scanService: ScanService,
  ) {}

  async findAllByUser(userId: string) {
    return this.prisma.graph.findMany({
      where: { userId },
      include: { _count: { select: { nodes: true, edges: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findRecentPublic(limit = 20, skip = 0, sort: 'recent' | 'endorsed' = 'recent') {
    return this.prisma.graph.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
        _count: { select: { nodes: true, edges: true } },
      },
      orderBy: sort === 'endorsed' ? { endorsementCount: 'desc' } : { createdAt: 'desc' },
      take: Math.min(limit, 50),
      skip,
    });
  }

  async findById(id: string, userId?: string) {
    const graph = await this.prisma.graph.findUnique({
      where: { id },
      include: {
        nodes: { include: { category: true } },
        edges: true,
        categories: { orderBy: { sortOrder: 'asc' } },
        forkedFrom: {
          select: {
            id: true,
            slug: true,
            title: true,
            user: { select: { username: true } },
          },
        },
      },
    });
    if (!graph) throw new NotFoundException('Graph not found');
    if (userId && graph.userId !== userId) throw new ForbiddenException();
    return graph;
  }

  async findPublic(username: string, slug: string) {
    const graph = await this.prisma.graph.findFirst({
      where: {
        slug,
        isPublic: true,
        user: { username },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        forkedFrom: {
          select: {
            id: true,
            slug: true,
            title: true,
            user: { select: { username: true } },
          },
        },
        nodes: { include: { category: true } },
        edges: true,
        categories: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!graph) throw new NotFoundException('Graph not found');
    return graph;
  }

  async create(userId: string, dto: CreateGraphDto) {
    const baseSlug = slugify(dto.title, { lower: true, strict: true });
    const slug = await this.ensureUniqueSlug(userId, baseSlug);

    try {
      return await this.prisma.graph.create({
        data: {
          userId,
          title: dto.title,
          slug,
          description: dto.description,
          isPublic: dto.isPublic ?? true,
          theme: dto.theme ?? 'cyberpunk',
        },
      });
    } catch (error) {
      // Retry once on unique constraint violation (slug race condition)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const retrySlug = `${baseSlug}-${Date.now()}`;
        return this.prisma.graph.create({
          data: {
            userId,
            title: dto.title,
            slug: retrySlug,
            description: dto.description,
            isPublic: dto.isPublic ?? true,
            theme: dto.theme ?? 'cyberpunk',
          },
        });
      }
      throw error;
    }
  }

  async update(id: string, userId: string, dto: UpdateGraphDto) {
    await this.verifyOwnership(id, userId);

    const data: Record<string, unknown> = { ...dto };
    if (dto.title) {
      data.slug = await this.ensureUniqueSlug(
        userId,
        slugify(dto.title, { lower: true, strict: true }),
        id,
      );
    }

    return this.prisma.graph.update({ where: { id }, data });
  }

  async remove(id: string, userId: string) {
    await this.verifyOwnership(id, userId);
    return this.prisma.graph.delete({ where: { id } });
  }

  /** Lightweight ownership check — does NOT load nodes/edges/categories */
  private async verifyOwnership(id: string, userId: string) {
    const graph = await this.prisma.graph.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!graph) throw new NotFoundException('Graph not found');
    if (graph.userId !== userId) throw new ForbiddenException();
  }

  private async ensureUniqueSlug(
    userId: string,
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    // Single query: fetch all slugs matching the base pattern
    const existing = await this.prisma.graph.findMany({
      where: {
        userId,
        slug: { startsWith: baseSlug },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { slug: true },
    });

    const existingSlugs = new Set(existing.map((g) => g.slug));
    if (!existingSlugs.has(baseSlug)) return baseSlug;

    for (let i = 1; i <= 100; i++) {
      const candidate = `${baseSlug}-${i}`;
      if (!existingSlugs.has(candidate)) return candidate;
    }

    // Fallback: append timestamp to guarantee uniqueness
    return `${baseSlug}-${Date.now()}`;
  }

  async forkGraph(sourceGraphId: string, userId: string, dto: ForkGraphDto) {
    const sourceGraph = await this.prisma.graph.findUnique({
      where: { id: sourceGraphId },
      include: {
        nodes: { include: { category: true } },
        edges: true,
        categories: { orderBy: { sortOrder: 'asc' } },
        user: { select: { username: true } },
      },
    });

    if (!sourceGraph) throw new NotFoundException('Graph not found');
    if (!sourceGraph.isPublic) throw new ForbiddenException('Cannot fork a private graph');
    if (sourceGraph.userId === userId) throw new ForbiddenException('Cannot fork your own graph');

    const title = (dto.title?.trim() || `${sourceGraph.title} (fork)`).slice(0, 200);
    const includeEdges = dto.includeEdges !== false;

    const slug = await this.ensureUniqueSlug(userId, slugify(title, { lower: true, strict: true }));

    const newGraph = await this.prisma.$transaction(async (tx) => {
      const created = await tx.graph.create({
        data: {
          userId,
          title,
          slug,
          description: sourceGraph.description,
          isPublic: true,
          theme: sourceGraph.theme,
          forkedFromId: sourceGraph.id,
        },
      });

      // Copy categories
      const categoryMap = new Map<string, string>();
      for (const cat of sourceGraph.categories) {
        const newCat = await tx.category.create({
          data: {
            graphId: created.id,
            name: cat.name,
            color: cat.color,
            sortOrder: cat.sortOrder,
          },
        });
        categoryMap.set(cat.id, newCat.id);
      }

      // Copy nodes
      const nodeMap = new Map<string, string>();
      for (const node of sourceGraph.nodes) {
        const newCatId = node.categoryId ? (categoryMap.get(node.categoryId) ?? null) : null;
        const newNode = await tx.node.create({
          data: {
            graphId: created.id,
            name: node.name,
            description: node.description,
            level: node.level,
            nodeType: node.nodeType,
            icon: node.icon,
            positionX: node.positionX,
            positionY: node.positionY,
            customData: (node.customData as object) ?? {},
            isUnlocked: node.isUnlocked,
            categoryId: newCatId,
          },
        });
        nodeMap.set(node.id, newNode.id);
      }

      // Copy edges
      if (includeEdges && sourceGraph.edges.length > 0) {
        const edgeData = sourceGraph.edges
          .map((edge) => {
            const newSource = nodeMap.get(edge.sourceNodeId);
            const newTarget = nodeMap.get(edge.targetNodeId);
            if (!newSource || !newTarget) return null;
            return {
              graphId: created.id,
              sourceNodeId: newSource,
              targetNodeId: newTarget,
              label: edge.label,
              edgeType: edge.edgeType,
            };
          })
          .filter(Boolean) as Array<{
          graphId: string;
          sourceNodeId: string;
          targetNodeId: string;
          label: string | null;
          edgeType: string;
        }>;

        if (edgeData.length > 0) {
          await tx.edge.createMany({ data: edgeData });
        }
      }

      // Increment fork count on source
      await tx.graph.update({
        where: { id: sourceGraph.id },
        data: { forkCount: { increment: 1 } },
      });

      return created;
    });

    return { id: newGraph.id, slug: newGraph.slug };
  }

  async createFromScan(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubUsername: true, username: true },
    });
    if (!user?.githubUsername) {
      throw new BadRequestException('GitHub account not linked. Connect GitHub in settings first.');
    }

    const scan = await this.scanService.scanUsername(user.githubUsername);

    if (scan.categories.length === 0) {
      throw new BadRequestException(
        'No recognizable skills found in your GitHub repositories. Make sure you have public repos with code.',
      );
    }

    const title = `GitHub Skills — ${user.githubUsername}`;
    const slug = await this.ensureUniqueSlug(userId, slugify(title, { lower: true, strict: true }));

    const newGraph = await this.prisma.$transaction(async (tx) => {
      const graph = await tx.graph.create({
        data: {
          userId,
          title,
          slug,
          description: `Auto-generated skill tree from ${scan.totalRepos} GitHub repos. ${scan.totalSkills} skills across ${scan.categories.length} categories.`,
          isPublic: true,
          theme: 'cyberpunk',
        },
      });

      // Create categories and collect mapping
      const categoryMap = new Map<string, string>();
      for (let i = 0; i < scan.categories.length; i++) {
        const cat = scan.categories[i]!;
        const created = await tx.category.create({
          data: {
            graphId: graph.id,
            name: cat.name,
            color: cat.color,
            sortOrder: i,
          },
        });
        categoryMap.set(cat.name, created.id);
      }

      // Layout: root at center, categories in a circle, skills fan out from each category
      const centerX = 0;
      const centerY = 0;
      const categoryRadius = 350;
      const skillRadius = 200;

      // Root node
      const rootNode = await tx.node.create({
        data: {
          graphId: graph.id,
          name: user.githubUsername!,
          description: `${scan.totalRepos} repos · ${scan.totalLanguages} languages · ${scan.totalSkills} skills`,
          level: 'expert',
          nodeType: 'skill',
          positionX: centerX,
          positionY: centerY,
          isUnlocked: true,
        },
      });

      const edgeData: Array<{
        graphId: string;
        sourceNodeId: string;
        targetNodeId: string;
        label: string | null;
        edgeType: string;
      }> = [];

      for (let ci = 0; ci < scan.categories.length; ci++) {
        const cat = scan.categories[ci]!;
        const categoryId = categoryMap.get(cat.name)!;
        const angle = (2 * Math.PI * ci) / scan.categories.length - Math.PI / 2;
        const catX = centerX + Math.cos(angle) * categoryRadius;
        const catY = centerY + Math.sin(angle) * categoryRadius;

        // Create hub node (top skill in category)
        const hubSkill = cat.skills[0];
        const hubNode = await tx.node.create({
          data: {
            graphId: graph.id,
            categoryId,
            name: hubSkill?.name ?? cat.name,
            description: `Score: ${cat.score}/100`,
            level: hubSkill?.level ?? 'intermediate',
            nodeType: 'skill',
            positionX: catX,
            positionY: catY,
            isUnlocked: true,
          },
        });

        // Edge: root → hub
        edgeData.push({
          graphId: graph.id,
          sourceNodeId: rootNode.id,
          targetNodeId: hubNode.id,
          label: cat.name,
          edgeType: 'default',
        });

        // Create remaining skill nodes
        const remainingSkills = cat.skills.slice(1);
        const fanAngle = Math.PI / 3; // 60 degree fan
        for (let si = 0; si < remainingSkills.length; si++) {
          const skill = remainingSkills[si]!;
          // Spread skills in a fan pattern extending outward from hub
          const skillAngle =
            remainingSkills.length === 1
              ? angle
              : angle - fanAngle / 2 + (fanAngle * si) / (remainingSkills.length - 1);
          const skillX = catX + Math.cos(skillAngle) * skillRadius;
          const skillY = catY + Math.sin(skillAngle) * skillRadius;

          const skillNode = await tx.node.create({
            data: {
              graphId: graph.id,
              categoryId,
              name: skill.name,
              level: skill.level,
              nodeType: 'skill',
              positionX: skillX,
              positionY: skillY,
              isUnlocked: true,
            },
          });

          // Edge: hub → skill
          edgeData.push({
            graphId: graph.id,
            sourceNodeId: hubNode.id,
            targetNodeId: skillNode.id,
            label: null,
            edgeType: 'dependency',
          });
        }
      }

      if (edgeData.length > 0) {
        await tx.edge.createMany({ data: edgeData });
      }

      return graph;
    });

    return { id: newGraph.id, slug: newGraph.slug };
  }

  async getPitchData(username: string, slug: string, vacancyId: string) {
    const [graph, vacancy] = await Promise.all([
      this.findPublic(username, slug),
      this.prisma.vacancy.findUnique({ where: { id: vacancyId } }),
    ]);

    if (!vacancy) throw new NotFoundException('Vacancy not found');

    const vacancySkills = (vacancy.skills as unknown as VacancySkill[]) ?? [];
    const match = computeMatchScore(vacancySkills, graph.nodes);

    // Build nodeMatchMap: nodeId → status
    const requiredNamesLower = new Map<string, VacancySkill>();
    for (const vs of vacancySkills) {
      requiredNamesLower.set(vs.name.toLowerCase(), vs);
    }

    const nodeMatchMap: Record<string, 'matched' | 'upgrade' | 'bonus'> = {};
    for (const node of graph.nodes) {
      const nameLower = node.name.toLowerCase();
      const req = requiredNamesLower.get(nameLower);
      if (req) {
        const reqLevel: SkillLevel = isValidLevel(req.level) ? req.level : 'beginner';
        const candLevel = node.level;
        if (isValidLevel(candLevel) && LEVEL_WEIGHT[candLevel] >= LEVEL_WEIGHT[reqLevel]) {
          nodeMatchMap[node.id] = 'matched';
        } else {
          nodeMatchMap[node.id] = 'upgrade';
        }
      } else {
        nodeMatchMap[node.id] = 'bonus';
      }
    }

    // Missing skills
    const candidateNamesLower = new Set(
      graph.nodes.map((n: { name: string }) => n.name.toLowerCase()),
    );
    const missingSkills = vacancySkills
      .filter((vs) => !candidateNamesLower.has(vs.name.toLowerCase()))
      .map((vs) => ({
        name: vs.name,
        requiredLevel: vs.level,
        category: vs.category,
        categoryColor: vs.categoryColor,
      }));

    // Category breakdown
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

      const candNode = graph.nodes.find(
        (n: { name: string }) => n.name.toLowerCase() === reqSkill.name.toLowerCase(),
      );
      if (candNode) {
        const candLevel = candNode.level;
        if (isValidLevel(candLevel)) {
          if (LEVEL_WEIGHT[candLevel] >= LEVEL_WEIGHT[reqLevel]) {
            catStat.score += weight;
            catStat.matched++;
          } else {
            catStat.score += LEVEL_WEIGHT[candLevel] * 0.5;
          }
        }
      }
    }

    const categoryBreakdown = Array.from(categoryStats.entries()).map(([name, stat]) => ({
      name,
      color: stat.color,
      matchScore: stat.maxScore > 0 ? Math.round((stat.score / stat.maxScore) * 100) : 0,
      matched: stat.matched,
      total: stat.total,
    }));

    return {
      ...graph,
      pitchData: {
        vacancyId: vacancy.id,
        vacancyTitle: vacancy.title,
        company: vacancy.company,
        matchScore: match.matchScore,
        matchedCount: match.matchedCount,
        upgradeCount: match.upgradeCount,
        missingCount: match.missingCount,
        totalRequired: match.totalRequired,
        nodeMatchMap,
        missingSkills,
        categoryBreakdown,
      },
    };
  }
}
