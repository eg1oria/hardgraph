import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

function levelRank(level: string): number {
  switch (level) {
    case 'expert':
      return 4;
    case 'advanced':
      return 3;
    case 'intermediate':
      return 2;
    default:
      return 1;
  }
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        githubUsername: true,
        plan: true,
        role: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /** Full user record for internal auth — includes passwordHash */
  async findByEmailFull(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash?: string;
    displayName?: string;
    githubId?: string;
    githubUsername?: string;
    githubAccessToken?: string;
    avatarUrl?: string;
    emailVerified?: boolean;
  }) {
    return this.prisma.user.create({ data });
  }

  async findByGithubId(githubId: string) {
    return this.prisma.user.findFirst({ where: { githubId } });
  }

  async linkGithub(
    userId: string,
    data: {
      githubId: string;
      githubUsername: string;
      githubAccessToken: string;
      avatarUrl?: string;
    },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        githubUsername: true,
        websiteUrl: true,
        twitterHandle: true,
        linkedinUrl: true,
        createdAt: true,
        graphs: {
          where: { isPublic: true },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            theme: true,
            viewCount: true,
            isPrimary: true,
            createdAt: true,
            categories: {
              select: { id: true, name: true, color: true },
            },
            nodes: {
              select: {
                name: true,
                level: true,
                categoryId: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Aggregate skills from all public graphs into category-based stats
    const categoryMap = new Map<
      string,
      { name: string; color: string; skills: Map<string, { name: string; level: string }> }
    >();

    for (const graph of user.graphs) {
      // Build categoryId → category lookup for this graph
      const catLookup = new Map<string, { name: string; color: string }>();
      for (const cat of graph.categories) {
        catLookup.set(cat.id, { name: cat.name, color: cat.color ?? '#6366f1' });
      }

      for (const node of graph.nodes) {
        const cat = node.categoryId ? catLookup.get(node.categoryId) : null;
        const catName = cat?.name ?? 'Other';
        const catColor = cat?.color ?? '#6366f1';

        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { name: catName, color: catColor, skills: new Map() });
        }
        const entry = categoryMap.get(catName)!;

        // Keep highest level per skill name
        const existing = entry.skills.get(node.name);
        if (!existing || levelRank(node.level) > levelRank(existing.level)) {
          entry.skills.set(node.name, { name: node.name, level: node.level });
        }
      }
    }

    const LEVEL_WEIGHTS: Record<string, number> = {
      beginner: 30,
      intermediate: 55,
      advanced: 75,
      expert: 95,
    };

    const skillStats = [...categoryMap.values()]
      .map((cat) => {
        const skills = [...cat.skills.values()].map((s) => ({
          name: s.name,
          level: s.level as 'beginner' | 'intermediate' | 'advanced' | 'expert',
          weight: LEVEL_WEIGHTS[s.level] ?? 50,
        }));
        skills.sort((a, b) => b.weight - a.weight);
        const avgWeight = skills.reduce((sum, s) => sum + s.weight, 0) / skills.length;
        const countMultiplier = Math.min(1 + skills.length * 0.1, 1.5);
        const score = Math.min(100, Math.round((avgWeight * countMultiplier) / 1.5));
        return { name: cat.name, color: cat.color, skills, score };
      })
      .sort((a, b) => b.score - a.score);

    // Strip nodes/categories from graphs to keep response lean
    const graphs = user.graphs.map(({ categories: _c, nodes: _n, ...g }) => g);

    return { ...user, graphs, skillStats };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }
}
