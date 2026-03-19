import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SkillLevel,
  SkillGapItem,
  BonusSkill,
  GapAnalysisResult,
  CategoryBreakdown,
} from './gap-analysis.types';

const LEVEL_WEIGHT: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const LEVEL_ORDER: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

/** Simple recommendation templates for popular skills */
const SKILL_RECOMMENDATIONS: Record<string, Record<string, string>> = {
  missing: {
    javascript: 'Start with JavaScript fundamentals on MDN Web Docs or freeCodeCamp',
    typescript: 'Learn TypeScript fundamentals through official docs or courses on freeCodeCamp',
    react: 'Begin with the official React tutorial and build small projects',
    'next.js': 'Follow the official Next.js Learn course to understand App Router and SSR',
    'node.js': 'Start with the official Node.js guides and build a REST API',
    python: 'Learn Python basics through Python.org tutorial or Automate the Boring Stuff',
    docker: 'Start with Docker Getting Started guide and containerize a simple app',
    kubernetes: 'Begin with Kubernetes basics on kubernetes.io and try Minikube locally',
    git: 'Learn Git fundamentals with Pro Git book (free online) and practice branching',
    sql: 'Practice SQL queries on SQLBolt or LeetCode Database problems',
    graphql: 'Start with the official GraphQL tutorial and build a simple API',
    rust: 'Follow The Rust Book (doc.rust-lang.org) from start to finish',
    go: 'Complete the Tour of Go and build a CLI tool',
    aws: 'Start with AWS Cloud Practitioner learning path and free tier services',
    css: 'Master CSS layout with Flexbox Froggy and Grid Garden games',
    html: 'Learn semantic HTML through MDN Web Docs tutorials',
    vue: 'Follow the official Vue.js tutorial and build a small SPA',
    angular: 'Complete the Angular Tour of Heroes tutorial',
    svelte: 'Follow the official Svelte interactive tutorial at svelte.dev',
    redis: 'Try Redis through the official interactive tutorial at try.redis.io',
    mongodb: 'Start with MongoDB University free courses',
    postgresql: 'Learn PostgreSQL with the official tutorial and practice on pgexercises.com',
    figma: 'Complete Figma basics course and practice recreating existing designs',
    tailwindcss: 'Read the Tailwind CSS docs and rebuild a UI component library',
    'tailwind css': 'Read the Tailwind CSS docs and rebuild a UI component library',
    prisma: 'Follow the Prisma Getting Started guide and build a data model',
    nestjs: 'Complete the NestJS fundamentals course in the official docs',
    express: 'Build a REST API with Express following the official guide',
    linux: 'Practice Linux commands on OverTheWire Bandit wargame',
    terraform: 'Start with HashiCorp Learn tutorials for Terraform',
    ci: 'Set up a CI pipeline with GitHub Actions for a personal project',
    'ci/cd': 'Set up a CI/CD pipeline with GitHub Actions for a personal project',
    testing: 'Learn testing fundamentals with Jest or Vitest and practice TDD',
    agile: 'Study the Agile Manifesto and try running sprints on a personal project',
    scrum: 'Get familiar with Scrum framework through Scrum.org resources',
  },
  upgrade: {
    javascript:
      'Deepen your JS knowledge: closures, prototypes, async patterns, and event loop internals',
    typescript:
      'Master advanced TypeScript: generics, conditional types, mapped types, and type gymnastics',
    react: 'Build complex projects, learn state management patterns and performance optimization',
    'next.js': 'Master SSR/SSG strategies, middleware, caching, and deploy production-grade apps',
    'node.js':
      'Study Node.js internals: streams, worker threads, clustering, and performance profiling',
    python: 'Explore advanced Python: decorators, metaclasses, async/await, and design patterns',
    docker: 'Master multi-stage builds, compose orchestration, and security best practices',
    kubernetes: 'Deploy production clusters, learn Helm charts, and implement GitOps workflows',
    git: 'Master advanced Git: interactive rebase, bisect, reflog, and collaborative workflows',
    sql: 'Study query optimization, window functions, CTEs, and database indexing strategies',
    css: 'Master CSS animations, custom properties, container queries, and advanced layouts',
    vue: 'Learn Composition API, state management with Pinia, and build production apps',
    angular: 'Master dependency injection, RxJS patterns, and build enterprise-grade apps',
    aws: 'Get hands-on with core services (EC2, Lambda, S3, RDS) and pursue Solutions Architect cert',
    testing:
      'Implement integration and E2E testing, learn mocking strategies and coverage analysis',
  },
};

function getRecommendation(
  skillName: string,
  status: 'missing' | 'upgrade',
  targetLevel: SkillLevel,
): string {
  const key = skillName.toLowerCase();
  const map = SKILL_RECOMMENDATIONS[status];
  if (map && map[key]) return map[key];

  if (status === 'missing') {
    return `Learn ${skillName} fundamentals and practice to reach ${targetLevel} level`;
  }
  return `Practice and deepen your knowledge in ${skillName} to reach ${targetLevel} level`;
}

function isValidLevel(level: string): level is SkillLevel {
  return LEVEL_ORDER.includes(level as SkillLevel);
}

@Injectable()
export class GapAnalysisService {
  private readonly logger = new Logger(GapAnalysisService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableTargets(field?: string) {
    const where = field ? { field: { equals: field, mode: 'insensitive' as const } } : {};
    const templates = await this.prisma.template.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { usageCount: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        field: true,
        isFeatured: true,
        usageCount: true,
        graphData: true,
      },
    });

    return templates.map((t) => {
      const gd = t.graphData as { nodes?: unknown[] } | null;
      return {
        ...t,
        skillCount: gd?.nodes?.length ?? 0,
      };
    });
  }

  async analyze(graphId: string, templateId: string, userId: string): Promise<GapAnalysisResult> {
    // 1. Load user graph with ownership check
    const graph = await this.prisma.graph.findUnique({
      where: { id: graphId },
      select: {
        id: true,
        userId: true,
        nodes: {
          select: {
            name: true,
            level: true,
            icon: true,
            categoryId: true,
            category: { select: { name: true, color: true } },
          },
        },
        categories: {
          select: { id: true, name: true, color: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!graph) throw new NotFoundException('Graph not found');
    if (graph.userId !== userId)
      throw new ForbiddenException('You can only analyze your own graphs');

    // 2. Load template
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });
    if (!template) throw new NotFoundException('Template not found');

    const graphData = template.graphData as {
      nodes?: Array<Record<string, unknown>>;
      categories?: Array<Record<string, unknown>>;
    };

    const templateNodes = graphData.nodes ?? [];
    const templateCategories = graphData.categories ?? [];

    // Build category map for template: id → { name, color }
    const templateCategoryMap = new Map<string, { name: string; color: string }>();
    for (const cat of templateCategories) {
      templateCategoryMap.set(cat.id as string, {
        name: cat.name as string,
        color: (cat.color as string) ?? '#6B7280',
      });
    }

    // Build user skills map: lowercase name → { level, icon, category }
    const userSkillMap = new Map<
      string,
      { level: string; icon?: string; category?: string; categoryColor?: string }
    >();
    for (const node of graph.nodes) {
      userSkillMap.set(node.name.toLowerCase(), {
        level: node.level,
        icon: node.icon ?? undefined,
        category: node.category?.name,
        categoryColor: node.category?.color ?? undefined,
      });
    }

    // 3. Perform matching
    const skills: SkillGapItem[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;
    let matchedCount = 0;
    let upgradeCount = 0;
    let missingCount = 0;

    // Per-category tracking
    const categoryStats = new Map<
      string,
      { color: string; matched: number; total: number; score: number; maxScore: number }
    >();

    for (const templateNode of templateNodes) {
      const templateName = templateNode.name as string;
      const templateLevelRaw = (templateNode.level as string) ?? 'beginner';
      const templateLevel: SkillLevel = isValidLevel(templateLevelRaw)
        ? templateLevelRaw
        : 'beginner';
      const templateIcon = templateNode.icon as string | undefined;
      const templateCatId = templateNode.categoryId as string | undefined;
      const templateCat = templateCatId ? templateCategoryMap.get(templateCatId) : undefined;

      const weight = LEVEL_WEIGHT[templateLevel];
      maxPossibleScore += weight;

      // Track category
      const catKey = templateCat?.name ?? 'Uncategorized';
      const catColor = templateCat?.color ?? '#6B7280';
      if (!categoryStats.has(catKey)) {
        categoryStats.set(catKey, { color: catColor, matched: 0, total: 0, score: 0, maxScore: 0 });
      }
      const catStat = categoryStats.get(catKey)!;
      catStat.total++;
      catStat.maxScore += weight;

      // Find user skill by name (case-insensitive)
      const userSkill = userSkillMap.get(templateName.toLowerCase());

      if (userSkill) {
        const userLevel: SkillLevel = isValidLevel(userSkill.level) ? userSkill.level : 'beginner';

        if (LEVEL_WEIGHT[userLevel] >= LEVEL_WEIGHT[templateLevel]) {
          // Matched
          totalScore += weight;
          catStat.score += weight;
          catStat.matched++;
          matchedCount++;
          skills.push({
            name: templateName,
            icon: userSkill.icon ?? templateIcon,
            category: templateCat?.name ?? userSkill.category,
            categoryColor: templateCat?.color ?? userSkill.categoryColor,
            userLevel,
            targetLevel: templateLevel,
            status: 'matched',
          });
        } else {
          // Upgrade needed
          const partialScore = LEVEL_WEIGHT[userLevel] * 0.5;
          totalScore += partialScore;
          catStat.score += partialScore;
          upgradeCount++;
          skills.push({
            name: templateName,
            icon: userSkill.icon ?? templateIcon,
            category: templateCat?.name ?? userSkill.category,
            categoryColor: templateCat?.color ?? userSkill.categoryColor,
            userLevel,
            targetLevel: templateLevel,
            status: 'upgrade',
            recommendation: getRecommendation(templateName, 'upgrade', templateLevel),
          });
        }
      } else {
        // Missing
        missingCount++;
        skills.push({
          name: templateName,
          icon: templateIcon,
          category: templateCat?.name,
          categoryColor: templateCat?.color,
          userLevel: null,
          targetLevel: templateLevel,
          status: 'missing',
          recommendation: getRecommendation(templateName, 'missing', templateLevel),
        });
      }
    }

    // 4. Find bonus skills (user skills not in template)
    const templateNameSet = new Set(templateNodes.map((n) => (n.name as string).toLowerCase()));
    const bonusSkills: BonusSkill[] = [];
    for (const node of graph.nodes) {
      if (!templateNameSet.has(node.name.toLowerCase())) {
        bonusSkills.push({
          name: node.name,
          level: node.level,
          category: node.category?.name,
        });
      }
    }

    // 5. Build category breakdown
    const categoryBreakdown: CategoryBreakdown[] = [];
    for (const [name, stat] of categoryStats) {
      categoryBreakdown.push({
        name,
        color: stat.color,
        matchScore: stat.maxScore > 0 ? Math.round((stat.score / stat.maxScore) * 100) : 0,
        matched: stat.matched,
        total: stat.total,
      });
    }

    const matchScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    // Increment usage count (fire-and-forget)
    this.prisma.template
      .update({ where: { id: templateId }, data: { usageCount: { increment: 1 } } })
      .catch((err) =>
        this.logger.warn(
          `Failed to increment usageCount for template ${templateId}: ${err.message}`,
        ),
      );

    return {
      graphId,
      templateId,
      templateName: template.name,
      matchScore,
      totalSkills: templateNodes.length,
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
