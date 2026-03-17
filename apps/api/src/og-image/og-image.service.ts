import { Injectable } from '@nestjs/common';
import { Resvg } from '@resvg/resvg-js';
import { ScanResult } from '../scan/scan.types';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#22D3EE',
  intermediate: '#818CF8',
  advanced: '#A78BFA',
  expert: '#FBBF24',
};

const LEVEL_ICONS: Record<string, string> = {
  beginner: '○',
  intermediate: '◐',
  advanced: '◕',
  expert: '●',
};

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

interface OgGraphData {
  title: string;
  description: string | null;
  username: string;
  displayName: string | null;
  nodeCount: number;
  endorsementCount: number;
  skills: Array<{ name: string; level: string; categoryColor: string | null }>;
}

interface CacheEntry {
  png: Buffer;
  createdAt: number;
}

const CACHE_TTL = 3600_000; // 1 hour

@Injectable()
export class OgImageService {
  private cache = new Map<string, CacheEntry>();

  generateOgImage(data: OgGraphData): Buffer {
    const cacheKey = `${data.username}/${data.title}/${data.nodeCount}/${data.endorsementCount}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
      return cached.png;
    }

    const svg = this.generateOgSvg(data);
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = Buffer.from(resvg.render().asPng());

    // Evict old entries if cache gets too large
    if (this.cache.size > 500) {
      const now = Date.now();
      for (const [key, entry] of this.cache) {
        if (now - entry.createdAt > CACHE_TTL) this.cache.delete(key);
      }
    }

    this.cache.set(cacheKey, { png, createdAt: Date.now() });
    return png;
  }

  private generateOgSvg(data: OgGraphData): string {
    const W = 1200;
    const H = 630;
    const PAD = 60;

    const title = esc(truncate(data.title, 40));
    const subtitle = data.displayName
      ? `${esc(truncate(data.displayName, 25))} · @${esc(data.username)}`
      : `@${esc(data.username)}`;

    const topSkills = data.skills.slice(0, 6);

    const skillChips = topSkills
      .map((skill, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = PAD + col * 360;
        const y = 340 + row * 80;
        const color = skill.categoryColor || LEVEL_COLORS[skill.level] || '#818CF8';
        const icon = LEVEL_ICONS[skill.level] || '○';
        const name = esc(truncate(skill.name, 26));
        const chipW = 340;

        return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${chipW}" height="56" rx="12" fill="${esc(color)}0D" stroke="${esc(color)}33" stroke-width="1" />
      <text x="20" y="34" fill="${esc(color)}" font-size="16" font-family="${FONT}">${icon}</text>
      <text x="44" y="34" fill="#E2E8F0" font-size="16" font-weight="500" font-family="${FONT}">${name}</text>
    </g>`;
      })
      .join('');

    const extraCount = Math.max(0, data.nodeCount - 6);
    const extraText =
      extraCount > 0
        ? `<text x="${PAD}" y="520" fill="#475569" font-size="14" font-weight="500" font-family="${FONT}">+${extraCount} more skills</text>`
        : '';

    const statsText = `${data.nodeCount} skill${data.nodeCount !== 1 ? 's' : ''}${data.endorsementCount > 0 ? ` · ${data.endorsementCount} endorsement${data.endorsementCount !== 1 ? 's' : ''}` : ''}`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#0B1120" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#A855F7" />
    </linearGradient>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)" />

  <!-- Top accent line -->
  <rect x="0" y="0" width="${W}" height="4" fill="url(#accent)" opacity="0.8" />

  <!-- Decorative grid -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="0.8" fill="#1E293B" />
  </pattern>
  <rect width="${W}" height="${H}" fill="url(#grid)" opacity="0.5" />

  <!-- Title -->
  <text x="${PAD}" y="110" fill="url(#titleGrad)" font-size="48" font-weight="800" font-family="${FONT}" letter-spacing="-1">${title}</text>

  <!-- Subtitle -->
  <text x="${PAD}" y="155" fill="#64748B" font-size="20" font-weight="400" font-family="${FONT}">${subtitle}</text>

  <!-- Stats -->
  <text x="${PAD}" y="195" fill="#475569" font-size="16" font-weight="500" font-family="${FONT}">${esc(statsText)}</text>

  <!-- Divider -->
  <line x1="${PAD}" y1="225" x2="${W - PAD}" y2="225" stroke="#1E293B" stroke-width="1" />

  <!-- Section label -->
  <text x="${PAD}" y="270" fill="#94A3B8" font-size="11" font-weight="700" font-family="${FONT}" letter-spacing="1.5">TOP SKILLS</text>

  <!-- Skill chips (2 rows x 3 cols) -->
  ${skillChips}
  ${extraText}

  <!-- Bottom bar -->
  <rect x="0" y="${H - 64}" width="${W}" height="64" fill="#080D18" opacity="0.8" />
  <line x1="0" y1="${H - 64}" x2="${W}" y2="${H - 64}" stroke="#1E293B" stroke-width="1" />

  <!-- Logo -->
  <g transform="translate(${PAD}, ${H - 44})">
    <polygon points="10,0 18.66,5 18.66,15 10,20 1.34,15 1.34,5" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.7" />
    <polygon points="10,4 14.33,6.5 14.33,13.5 10,16 5.67,13.5 5.67,6.5" fill="#6366F1" opacity="0.2" />
  </g>
  <text x="${PAD + 28}" y="${H - 27}" fill="#64748B" font-size="15" font-weight="600" font-family="${FONT}">HardGraph</text>
  <text x="${W - PAD}" y="${H - 27}" fill="#334155" font-size="13" font-weight="500" font-family="${FONT}" text-anchor="end">hardgraph.io</text>
</svg>`;
  }

  generateDefaultOgImage(): Buffer {
    const W = 1200;
    const H = 630;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#A855F7" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect x="0" y="0" width="${W}" height="4" fill="url(#accent)" opacity="0.8" />
  <g transform="translate(${W / 2}, ${H / 2 - 30})">
    <polygon points="0,-40 34.64,-20 34.64,20 0,40 -34.64,20 -34.64,-20" fill="none" stroke="#6366F1" stroke-width="2.5" opacity="0.5" />
    <polygon points="0,-24 20.78,-12 20.78,12 0,24 -20.78,12 -20.78,-12" fill="#6366F1" opacity="0.15" />
  </g>
  <text x="${W / 2}" y="${H / 2 + 50}" fill="#F8FAFC" font-size="36" font-weight="800" font-family="${FONT}" text-anchor="middle" letter-spacing="-0.5">HardGraph</text>
  <text x="${W / 2}" y="${H / 2 + 85}" fill="#64748B" font-size="18" font-family="${FONT}" text-anchor="middle">Visualize Your Skills</text>
</svg>`;

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    return Buffer.from(resvg.render().asPng());
  }

  generateScanOgImage(result: ScanResult): Buffer {
    const cacheKey = `scan:${result.username}:${result.scannedAt}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
      return cached.png;
    }

    const svg = this.generateScanSvg(result);
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = Buffer.from(resvg.render().asPng());

    this.cache.set(cacheKey, { png, createdAt: Date.now() });
    return png;
  }

  private generateScanSvg(result: ScanResult): string {
    const W = 1200;
    const H = 630;
    const PAD = 60;

    const username = esc(truncate(result.username, 30));
    const topCats = result.categories.slice(0, 4);

    const barY0 = 200;
    const barSpacing = 70;
    const barMaxW = 500;

    const bars = topCats
      .map((cat, i) => {
        const y = barY0 + i * barSpacing;
        const barW = Math.round((cat.score / 100) * barMaxW);
        const catName = esc(truncate(cat.name, 15));
        const color = esc(cat.color);
        return `
    <text x="${PAD}" y="${y}" fill="#94A3B8" font-size="16" font-weight="600" font-family="${FONT}" width="120">${catName}</text>
    <rect x="${PAD + 140}" y="${y - 14}" width="${barMaxW}" height="20" rx="10" fill="#1E293B" />
    <rect x="${PAD + 140}" y="${y - 14}" width="${barW}" height="20" rx="10" fill="${color}" />
    <text x="${PAD + 140 + barMaxW + 16}" y="${y}" fill="${color}" font-size="16" font-weight="700" font-family="${FONT}">${cat.score}%</text>`;
      })
      .join('');

    const topSkillsText = result.topSkills
      .slice(0, 5)
      .map((s) => esc(s))
      .join(' · ');
    const statsText = `${result.totalRepos} repos · ${result.totalLanguages} languages`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#0B1120" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#A855F7" />
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect x="0" y="0" width="${W}" height="4" fill="url(#accent)" opacity="0.8" />

  <!-- Decorative grid -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="0.8" fill="#1E293B" />
  </pattern>
  <rect width="${W}" height="${H}" fill="url(#grid)" opacity="0.5" />

  <!-- URL -->
  <text x="${PAD}" y="60" fill="#475569" font-size="14" font-weight="500" font-family="${FONT}">hardgraph.io/scan/${username}</text>

  <!-- Username -->
  <text x="${PAD}" y="110" fill="#F8FAFC" font-size="42" font-weight="800" font-family="${FONT}" letter-spacing="-1">${username}</text>

  <!-- Stats -->
  <text x="${PAD}" y="150" fill="#64748B" font-size="18" font-weight="400" font-family="${FONT}">${esc(statsText)}</text>

  <!-- Divider -->
  <line x1="${PAD}" y1="170" x2="${W - PAD}" y2="170" stroke="#1E293B" stroke-width="1" />

  <!-- Category bars -->
  ${bars}

  <!-- Top Skills -->
  <text x="${PAD}" y="${barY0 + topCats.length * barSpacing + 30}" fill="#94A3B8" font-size="11" font-weight="700" font-family="${FONT}" letter-spacing="1.5">TOP SKILLS</text>
  <text x="${PAD}" y="${barY0 + topCats.length * barSpacing + 58}" fill="#E2E8F0" font-size="20" font-weight="600" font-family="${FONT}">${topSkillsText}</text>

  <!-- Bottom bar -->
  <rect x="0" y="${H - 64}" width="${W}" height="64" fill="#080D18" opacity="0.8" />
  <line x1="0" y1="${H - 64}" x2="${W}" y2="${H - 64}" stroke="#1E293B" stroke-width="1" />

  <!-- Logo -->
  <g transform="translate(${PAD}, ${H - 44})">
    <polygon points="10,0 18.66,5 18.66,15 10,20 1.34,15 1.34,5" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.7" />
    <polygon points="10,4 14.33,6.5 14.33,13.5 10,16 5.67,13.5 5.67,6.5" fill="#6366F1" opacity="0.2" />
  </g>
  <text x="${PAD + 28}" y="${H - 27}" fill="#64748B" font-size="15" font-weight="600" font-family="${FONT}">HardGraph</text>
  <text x="${W - PAD}" y="${H - 27}" fill="#334155" font-size="13" font-weight="500" font-family="${FONT}" text-anchor="end">Made with HardGraph</text>
</svg>`;
  }
}
