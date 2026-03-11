import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

@Injectable()
export class GithubService {
  constructor(private readonly prisma: PrismaService) {}

  async getRepos(userId: string): Promise<GithubRepo[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubUsername: true, githubAccessToken: true },
    });

    if (!user?.githubUsername || !user?.githubAccessToken) {
      throw new BadRequestException('GitHub account not linked');
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${user.githubAccessToken}`,
      'User-Agent': 'Skillgraph-App',
    };

    const url = `https://api.github.com/user/repos?type=public&sort=updated&per_page=100`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch GitHub repositories');
    }

    const repos = (await response.json()) as GithubRepo[];
    return repos
      .filter((r) => !r.name.startsWith('.'))
      .map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        updated_at: r.updated_at,
        topics: r.topics ?? [],
      }));
  }

  async getPublicReposByUsername(username: string): Promise<GithubRepo[]> {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=public&sort=updated&per_page=100`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Skillgraph-App',
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to fetch GitHub repositories');
    }

    const repos = (await response.json()) as GithubRepo[];
    return repos
      .filter((r) => !r.name.startsWith('.'))
      .map((r) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        updated_at: r.updated_at,
        topics: r.topics ?? [],
      }));
  }
}
