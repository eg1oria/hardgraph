import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService, GitHubProfileAnalysis } from '../github/github.service';

interface AICategory {
  name: string;
  color: string;
  sortOrder: number;
}

interface AINode {
  name: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  nodeType: string;
  icon: string;
  positionX: number;
  positionY: number;
  categoryName: string;
  isUnlocked: boolean;
}

interface AIEdge {
  sourceName: string;
  targetName: string;
  label: string;
}

interface AIResponse {
  title: string;
  description: string;
  categories: AICategory[];
  nodes: AINode[];
  edges: AIEdge[];
}

const LANGUAGE_CATEGORY_MAP: Record<string, string> = {
  TypeScript: 'Frontend',
  JavaScript: 'Frontend',
  HTML: 'Frontend',
  CSS: 'Frontend',
  SCSS: 'Frontend',
  Vue: 'Frontend',
  Svelte: 'Frontend',
  Python: 'Backend',
  Java: 'Backend',
  Go: 'Backend',
  Rust: 'Backend',
  'C#': 'Backend',
  PHP: 'Backend',
  Ruby: 'Backend',
  Kotlin: 'Backend',
  C: 'Backend',
  'C++': 'Backend',
  Dockerfile: 'DevOps',
  Shell: 'DevOps',
  HCL: 'DevOps',
  Nix: 'DevOps',
  'Jupyter Notebook': 'Data',
  R: 'Data',
  SQL: 'Data',
  Swift: 'Mobile',
  Dart: 'Mobile',
  'Objective-C': 'Mobile',
};

const CATEGORY_COLORS: Record<string, string> = {
  Frontend: '#3B82F6',
  Backend: '#10B981',
  DevOps: '#F59E0B',
  Data: '#8B5CF6',
  Mobile: '#EF4444',
};

const CATEGORY_ICONS: Record<string, string> = {
  Frontend: 'globe',
  Backend: 'server',
  DevOps: 'container',
  Data: 'database',
  Mobile: 'cpu',
};

const AI_PROMPT = `You are a developer skills analyst. Based on the GitHub profile data below, create a skill tree.

Rules:
- Create 3-5 categories (e.g., "Frontend", "Backend", "DevOps", "Data", "Mobile")
- Each category gets a distinct color (#hex)
- Create 8-20 skill nodes based on ACTUAL languages, frameworks, and technologies found in repos
- Assign levels: beginner (<5% of code), intermediate (5-20%), advanced (20-50%), expert (>50%)
- Create logical edges between related skills (e.g., TypeScript → React → Next.js)
- Position nodes in a tree layout: root at top (y=0), each level +200px down, spread horizontally by 250px
- Every node must have: name, description (1 sentence), level, category, icon (from lucide: code, globe, server, database, container, cloud, lock, terminal, git-branch, cpu, layers, box, rocket, zap, shield)

GitHub Profile Data:
{profileAnalysisJSON}

Respond in this EXACT JSON format:
{
  "title": "Username's Skill Tree",
  "description": "Auto-generated skill tree based on GitHub activity",
  "categories": [{ "name": "...", "color": "#...", "sortOrder": 0 }],
  "nodes": [{ "name": "...", "description": "...", "level": "beginner|intermediate|advanced|expert", "nodeType": "skill", "icon": "...", "positionX": 0, "positionY": 0, "categoryName": "...", "isUnlocked": true }],
  "edges": [{ "sourceName": "...", "targetName": "...", "label": "requires" }]
}`;

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly configService: ConfigService,
  ) {}

  async generateSkillTree(userId: string): Promise<{ graphId: string; graphSlug: string }> {
    await this.checkRateLimit(userId);

    const analysis = await this.githubService.analyzeProfile(userId);
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    let aiResult: AIResponse;

    if (openaiKey) {
      try {
        aiResult = await this.callOpenAI(openaiKey, analysis);
      } catch (err) {
        this.logger.warn(`AI generation failed, using fallback: ${err}`);
        aiResult = this.buildFallback(analysis);
      }
    } else {
      this.logger.log('No OPENAI_API_KEY configured, using rule-based generation');
      aiResult = this.buildFallback(analysis);
    }

    return this.persistGraph(userId, aiResult);
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan === 'pro') return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const count = await this.prisma.graph.count({
      where: {
        userId,
        customStyles: {
          path: ['aiGenerated'],
          equals: true,
        },
        createdAt: { gte: todayStart },
      },
    });

    if (count >= 3) {
      throw new ForbiddenException(
        'Free plan limit: 3 AI generations per day. Upgrade to Pro for unlimited.',
      );
    }
  }

  private async callOpenAI(apiKey: string, analysis: GitHubProfileAnalysis): Promise<AIResponse> {
    const prompt = AI_PROMPT.replace('{profileAnalysisJSON}', JSON.stringify(analysis, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content) as AIResponse;

    if (!parsed.categories?.length || !parsed.nodes?.length) {
      throw new Error('Invalid AI response structure');
    }

    return parsed;
  }

  private buildFallback(analysis: GitHubProfileAnalysis): AIResponse {
    const categorySet = new Map<string, AICategory>();
    const nodes: AINode[] = [];
    const edges: AIEdge[] = [];

    // Group languages into categories
    for (const lang of analysis.languages) {
      const catName = LANGUAGE_CATEGORY_MAP[lang.name] ?? 'Backend';
      if (!categorySet.has(catName)) {
        categorySet.set(catName, {
          name: catName,
          color: CATEGORY_COLORS[catName] ?? '#6B7280',
          sortOrder: categorySet.size,
        });
      }
    }

    if (categorySet.size === 0) {
      categorySet.set('General', { name: 'General', color: '#6B7280', sortOrder: 0 });
    }

    const categories = [...categorySet.values()];

    // Create skill nodes from languages
    const nodesByCategory = new Map<string, AINode[]>();

    for (const lang of analysis.languages.slice(0, 15)) {
      const catName = LANGUAGE_CATEGORY_MAP[lang.name] ?? 'Backend';
      let level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
      if (lang.percent > 50) level = 'expert';
      else if (lang.percent > 20) level = 'advanced';
      else if (lang.percent > 5) level = 'intermediate';
      else level = 'beginner';

      const icon = CATEGORY_ICONS[catName] ?? 'code';

      const node: AINode = {
        name: lang.name,
        description: `${lang.percent}% of codebase (${Math.round(lang.bytes / 1024)}KB)`,
        level,
        nodeType: 'skill',
        icon,
        positionX: 0,
        positionY: 0,
        categoryName: catName,
        isUnlocked: true,
      };

      if (!nodesByCategory.has(catName)) {
        nodesByCategory.set(catName, []);
      }
      nodesByCategory.get(catName)!.push(node);
      nodes.push(node);
    }

    // Assign positions: tree layout
    let globalY = 0;
    for (const [, catNodes] of nodesByCategory) {
      const startX = -((catNodes.length - 1) * 250) / 2;
      for (let i = 0; i < catNodes.length; i++) {
        catNodes[i]!.positionX = startX + i * 250;
        catNodes[i]!.positionY = globalY;
      }
      globalY += 200;

      // Create edges within a category (linear chain)
      for (let i = 1; i < catNodes.length; i++) {
        edges.push({
          sourceName: catNodes[i - 1]!.name,
          targetName: catNodes[i]!.name,
          label: 'related',
        });
      }
    }

    return {
      title: `${analysis.username}'s Skill Tree`,
      description: `Auto-generated skill tree based on ${analysis.totalRepos} GitHub repositories`,
      categories,
      nodes,
      edges,
    };
  }

  private async persistGraph(
    userId: string,
    aiResult: AIResponse,
  ): Promise<{ graphId: string; graphSlug: string }> {
    const slugify = (await import('slugify')).default;
    const baseSlug = slugify(aiResult.title, { lower: true, strict: true });

    // Ensure unique slug
    const existing = await this.prisma.graph.findFirst({
      where: { userId, slug: baseSlug },
      select: { id: true },
    });
    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

    const graph = await this.prisma.graph.create({
      data: {
        userId,
        title: aiResult.title,
        slug,
        description: aiResult.description,
        isPublic: true,
        theme: 'cyberpunk',
        customStyles: { aiGenerated: true },
      },
    });

    // Create categories
    const categoryMap = new Map<string, string>(); // name → id
    for (const cat of aiResult.categories) {
      const created = await this.prisma.category.create({
        data: {
          graphId: graph.id,
          name: cat.name,
          color: cat.color,
          sortOrder: cat.sortOrder,
        },
      });
      categoryMap.set(cat.name, created.id);
    }

    // Create nodes
    const nodeMap = new Map<string, string>(); // name → id
    for (const node of aiResult.nodes) {
      const categoryId = categoryMap.get(node.categoryName);
      const created = await this.prisma.node.create({
        data: {
          graphId: graph.id,
          name: node.name,
          description: node.description,
          level: node.level,
          nodeType: node.nodeType || 'skill',
          icon: node.icon,
          positionX: node.positionX,
          positionY: node.positionY,
          categoryId: categoryId ?? null,
          customData: {},
          isUnlocked: node.isUnlocked ?? true,
        },
      });
      nodeMap.set(node.name, created.id);
    }

    // Create edges
    for (const edge of aiResult.edges) {
      const sourceId = nodeMap.get(edge.sourceName);
      const targetId = nodeMap.get(edge.targetName);
      if (sourceId && targetId && sourceId !== targetId) {
        try {
          await this.prisma.edge.create({
            data: {
              graphId: graph.id,
              sourceNodeId: sourceId,
              targetNodeId: targetId,
              label: edge.label,
              edgeType: 'default',
            },
          });
        } catch {
          // Skip duplicate edges
        }
      }
    }

    return { graphId: graph.id, graphSlug: graph.slug };
  }
}
