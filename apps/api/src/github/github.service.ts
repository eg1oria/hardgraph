import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GitHubProfileAnalysis {
  username: string;
  totalRepos: number;
  languages: Array<{ name: string; bytes: number; percent: number }>;
  topRepos: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    topics: string[];
  }>;
  allTopics: string[];
}

interface ProfileCache {
  data: GitHubProfileAnalysis;
  timestamp: number;
}

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
  private readonly logger = new Logger(GithubService.name);
  private readonly profileCache = new Map<string, ProfileCache>();
  private static readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
      'User-Agent': 'HardGraph-App',
    };

    const url = `https://api.github.com/user/repos?type=public&sort=updated&per_page=100`;
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });

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
        'User-Agent': 'HardGraph-App',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new BadRequestException(`GitHub user not found`);
      }
      if (response.status === 403) {
        throw new BadRequestException('GitHub API rate limit exceeded. Please try again later.');
      }
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

  async analyzeProfile(userId: string): Promise<GitHubProfileAnalysis> {
    const cached = this.profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < GithubService.CACHE_TTL) {
      return cached.data;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { githubUsername: true, githubAccessToken: true },
    });

    if (!user?.githubUsername || !user?.githubAccessToken) {
      throw new BadRequestException('GitHub account not linked');
    }

    const repos = await this.getRepos(userId);
    const topReposByStar = [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 20);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${user.githubAccessToken}`,
      'User-Agent': 'HardGraph-App',
    };

    // Fetch languages for top 20 repos
    const languageTotals = new Map<string, number>();

    for (const repo of topReposByStar) {
      try {
        const url = `https://api.github.com/repos/${encodeURIComponent(repo.full_name)}/languages`;
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const langs = (await res.json()) as Record<string, number>;
          for (const [lang, bytes] of Object.entries(langs)) {
            languageTotals.set(lang, (languageTotals.get(lang) ?? 0) + bytes);
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch languages for ${repo.full_name}: ${err}`);
      }
    }

    const totalBytes = [...languageTotals.values()].reduce((a, b) => a + b, 0);
    const languages = [...languageTotals.entries()]
      .map(([name, bytes]) => ({
        name,
        bytes,
        percent: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes);

    const allTopicsSet = new Set<string>();
    for (const repo of repos) {
      for (const topic of repo.topics) {
        allTopicsSet.add(topic);
      }
    }

    const analysis: GitHubProfileAnalysis = {
      username: user.githubUsername,
      totalRepos: repos.length,
      languages,
      topRepos: topReposByStar.map((r) => ({
        name: r.name,
        description: r.description ?? '',
        language: r.language ?? '',
        stars: r.stargazers_count,
        topics: r.topics,
      })),
      allTopics: [...allTopicsSet],
    };

    this.profileCache.set(userId, { data: analysis, timestamp: Date.now() });
    return analysis;
  }
}
