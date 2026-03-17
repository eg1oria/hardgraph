import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { ScanResult } from './scan.types';
import { mapGitHubToSkills } from './skill-mapper';

interface ScanCache {
  data: ScanResult;
  timestamp: number;
}

@Injectable()
export class ScanService {
  private readonly logger = new Logger(ScanService.name);
  private readonly cache = new Map<string, ScanCache>();
  private static readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor(private readonly githubService: GithubService) {}

  private getGitHubHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'HardGraph-App',
      Accept: 'application/vnd.github.v3+json',
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async scanUsername(username: string): Promise<ScanResult> {
    const cacheKey = username.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ScanService.CACHE_TTL) {
      return cached.data;
    }

    // 1. Fetch user profile for avatar
    const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: this.getGitHubHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        throw new BadRequestException(`GitHub user "${username}" not found`);
      }
      if (profileRes.status === 403) {
        throw new BadRequestException('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new BadRequestException('Failed to fetch GitHub profile');
    }

    const profile = (await profileRes.json()) as { avatar_url: string; login: string };

    // 2. Fetch public repos (existing method)
    const repos = await this.githubService.getPublicReposByUsername(username);

    // 3. Get top 10 repos by stars for language analysis
    const topRepos = [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10);

    // 4. Fetch languages for top repos
    const languageTotals = new Map<string, number>();

    const languagePromises = topRepos.map(async (repo) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo.full_name}/languages`, {
          headers: this.getGitHubHeaders(),
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          return (await res.json()) as Record<string, number>;
        }
        return null;
      } catch (err) {
        this.logger.warn(`Failed to fetch languages for ${repo.full_name}: ${err}`);
        return null;
      }
    });

    const languageResults = await Promise.all(languagePromises);

    for (const langs of languageResults) {
      if (!langs) continue;
      for (const [lang, bytes] of Object.entries(langs)) {
        languageTotals.set(lang, (languageTotals.get(lang) ?? 0) + bytes);
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

    // 5. Collect all topics
    const allTopicsSet = new Set<string>();
    for (const repo of repos) {
      for (const topic of repo.topics) {
        allTopicsSet.add(topic);
      }
    }

    // 6. Map to skills
    const result = mapGitHubToSkills(
      repos,
      languages,
      [...allTopicsSet],
      profile.login,
      profile.avatar_url,
    );

    // 7. Cache
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

    // Evict old cache entries
    if (this.cache.size > 200) {
      const now = Date.now();
      for (const [key, entry] of this.cache) {
        if (now - entry.timestamp > ScanService.CACHE_TTL) {
          this.cache.delete(key);
        }
      }
    }

    return result;
  }
}
