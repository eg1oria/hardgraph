import { Injectable } from '@nestjs/common';

interface EmbedNode {
  name: string;
  level: string;
  category?: { name: string; color?: string | null } | null;
}

interface EmbedGraphData {
  title: string;
  user: { username: string; displayName?: string | null };
  nodes: EmbedNode[];
}

/** Escape XML-unsafe characters to prevent XSS in SVG output. */
function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Truncate text to maxLen chars, adding ellipsis if necessary. */
function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: '#22D3EE',
  intermediate: '#818CF8',
  advanced: '#A78BFA',
  expert: '#FBBF24',
};

const LEVEL_PROGRESS: Record<string, number> = {
  beginner: 0.25,
  intermediate: 0.5,
  advanced: 0.75,
  expert: 1.0,
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const LEVEL_ICONS: Record<string, string> = {
  beginner: '○',
  intermediate: '◐',
  advanced: '◕',
  expert: '●',
};

const MAX_SKILLS = 8;
const W = 495;
const PAD = 28;
const ROW_H = 38;
const HEADER_H = 88;
const FOOTER_H = 52;
const BAR_W = 90;
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

@Injectable()
export class EmbedService {
  generateSvg(graph: EmbedGraphData): string {
    const skills = graph.nodes.filter((n) => n.name).slice(0, MAX_SKILLS);

    if (skills.length === 0) {
      return this.generateEmptySvg(graph);
    }

    const extraCount = Math.max(0, graph.nodes.length - MAX_SKILLS);
    const hasExtra = extraCount > 0;
    const rowCount = skills.length + (hasExtra ? 1 : 0);
    const contentH = rowCount * ROW_H;
    const H = HEADER_H + contentH + FOOTER_H + 12;

    const title = esc(truncate(graph.title, 36));
    const username = esc(graph.user.username);
    const displayName = graph.user.displayName ? esc(truncate(graph.user.displayName, 28)) : null;

    const barX = W - PAD - BAR_W;

    const skillRows = skills
      .map((skill, i) => {
        const y = HEADER_H + i * ROW_H;
        const level = skill.level || 'beginner';
        const color = skill.category?.color || LEVEL_COLORS[level] || '#818CF8';
        const progress = LEVEL_PROGRESS[level] || 0.25;
        const label = LEVEL_LABELS[level] || 'Beginner';
        const icon = LEVEL_ICONS[level] || '○';
        const filledW = Math.round(BAR_W * progress);
        const name = esc(truncate(skill.name, 24));
        const gradId = `bar${i}`;

        return `
    <g transform="translate(0, ${y})">
      <text x="${PAD}" y="24" fill="${esc(color)}" font-size="11" font-family="${FONT}">${icon}</text>
      <text x="${PAD + 18}" y="24" fill="#E2E8F0" font-size="13" font-weight="500" font-family="${FONT}">${name}</text>
      <rect x="${barX}" y="12" width="${BAR_W}" height="14" rx="7" fill="#1E293B" />
      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${esc(color)}" stop-opacity="0.6" />
        <stop offset="100%" stop-color="${esc(color)}" />
      </linearGradient>
      <rect x="${barX}" y="12" width="${filledW}" height="14" rx="7" fill="url(#${gradId})" />
      <text x="${barX + BAR_W + 8}" y="24" fill="#64748B" font-size="9" font-weight="500" font-family="${FONT}" letter-spacing="0.5">${esc(label.toUpperCase())}</text>
    </g>`;
      })
      .join('');

    const extraRow = hasExtra
      ? `<text x="${PAD}" y="${HEADER_H + skills.length * ROW_H + 24}" fill="#475569" font-size="11" font-weight="500" font-family="${FONT}">+${extraCount} more skills</text>`
      : '';

    const footerY = H - FOOTER_H;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#A855F7" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Card background -->
  <rect width="${W}" height="${H}" rx="16" fill="url(#cardBg)" />
  <rect width="${W}" height="${H}" rx="16" stroke="#1E293B" stroke-width="1" />

  <!-- Top accent line -->
  <rect x="1" y="1" width="${W - 2}" height="3" rx="16" fill="url(#accentLine)" opacity="0.7" />

  <!-- Header -->
  <g>
    <text x="${PAD}" y="38" fill="#F8FAFC" font-size="18" font-weight="700" font-family="${FONT}" letter-spacing="-0.3">${title}</text>
    <text x="${PAD}" y="58" fill="#64748B" font-size="12" font-weight="400" font-family="${FONT}">${displayName ? displayName + ' · ' : ''}@${username}</text>
    <text x="${W - PAD}" y="58" fill="#475569" font-size="11" font-weight="500" font-family="${FONT}" text-anchor="end">${graph.nodes.length} skills</text>
    <line x1="${PAD}" y1="72" x2="${W - PAD}" y2="72" stroke="#1E293B" stroke-width="1" />
  </g>

  <!-- Skills -->
  ${skillRows}
  ${extraRow}

  <!-- Footer divider -->
  <line x1="${PAD}" y1="${footerY}" x2="${W - PAD}" y2="${footerY}" stroke="#1E293B" stroke-width="1" />

  <!-- Footer -->
  <g transform="translate(0, ${footerY})">
    <!-- HardGraph logo mark -->
    <g transform="translate(${PAD}, 14)">
      <polygon points="8,0 14.93,4 14.93,12 8,16 1.07,12 1.07,4" fill="none" stroke="#6366F1" stroke-width="1.2" opacity="0.6" />
      <polygon points="8,3 11.46,5 11.46,11 8,13 4.54,11 4.54,5" fill="#6366F1" opacity="0.15" />
    </g>
    <text x="${PAD + 22}" y="27" fill="#475569" font-size="11" font-weight="500" font-family="${FONT}">HardGraph</text>
    <text x="${W - PAD}" y="27" fill="#334155" font-size="10" font-weight="500" font-family="${FONT}" text-anchor="end">hardgraph.io</text>
  </g>
</svg>`;
  }

  private generateEmptySvg(graph: EmbedGraphData): string {
    const title = esc(truncate(graph.title, 36));
    const username = esc(graph.user.username);
    const H = 180;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#A855F7" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="url(#cardBg)" />
  <rect width="${W}" height="${H}" rx="16" stroke="#1E293B" stroke-width="1" />
  <rect x="1" y="1" width="${W - 2}" height="3" rx="16" fill="url(#accentLine)" opacity="0.7" />
  <text x="${PAD}" y="38" fill="#F8FAFC" font-size="18" font-weight="700" font-family="${FONT}" letter-spacing="-0.3">${title}</text>
  <text x="${PAD}" y="58" fill="#64748B" font-size="12" font-family="${FONT}">@${username}</text>
  <line x1="${PAD}" y1="72" x2="${W - PAD}" y2="72" stroke="#1E293B" stroke-width="1" />
  <g transform="translate(${W / 2}, 105)">
    <circle cx="0" cy="-8" r="16" fill="#1E293B" />
    <text x="0" y="-3" fill="#475569" font-size="14" font-family="${FONT}" text-anchor="middle">+</text>
    <text x="0" y="20" fill="#475569" font-size="12" font-weight="500" font-family="${FONT}" text-anchor="middle">No skills yet</text>
  </g>
  <line x1="${PAD}" y1="${H - 48}" x2="${W - PAD}" y2="${H - 48}" stroke="#1E293B" stroke-width="1" />
  <g transform="translate(${PAD}, ${H - 34})">
    <polygon points="8,0 14.93,4 14.93,12 8,16 1.07,12 1.07,4" fill="none" stroke="#6366F1" stroke-width="1.2" opacity="0.6" />
  </g>
  <text x="${PAD + 22}" y="${H - 21}" fill="#475569" font-size="11" font-weight="500" font-family="${FONT}">HardGraph</text>
</svg>`;
  }

  generateErrorSvg(message: string): string {
    const H = 140;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B1120" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="url(#cardBg)" />
  <rect width="${W}" height="${H}" rx="16" stroke="#1E293B" stroke-width="1" />
  <text x="${W / 2}" y="60" fill="#64748B" font-size="13" font-weight="500" font-family="${FONT}" text-anchor="middle">${esc(message)}</text>
  <g transform="translate(${W / 2 - 48}, ${H - 40})">
    <polygon points="8,0 14.93,4 14.93,12 8,16 1.07,12 1.07,4" fill="none" stroke="#6366F1" stroke-width="1.2" opacity="0.4" />
    <text x="22" y="13" fill="#334155" font-size="11" font-weight="500" font-family="${FONT}">hardgraph.io</text>
  </g>
</svg>`;
  }
}
