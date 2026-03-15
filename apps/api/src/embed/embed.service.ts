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
  intermediate: '#6366F1',
  advanced: '#A855F7',
  expert: '#F59E0B',
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

const MAX_SKILLS = 8;
const CARD_WIDTH = 480;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 72;
const FOOTER_HEIGHT = 48;
const PADDING = 24;
const BAR_WIDTH = 100;
const LABEL_WIDTH = 75;
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

@Injectable()
export class EmbedService {
  generateSvg(graph: EmbedGraphData): string {
    const skills = graph.nodes.filter((n) => n.name).slice(0, MAX_SKILLS);

    if (skills.length === 0) {
      return this.generateEmptySvg(graph);
    }

    const extraCount = Math.max(0, graph.nodes.length - MAX_SKILLS);
    const rowCount = skills.length + (extraCount > 0 ? 1 : 0);
    const contentHeight = rowCount * ROW_HEIGHT;
    const totalHeight = HEADER_HEIGHT + contentHeight + FOOTER_HEIGHT + PADDING;

    const title = esc(truncate(graph.title, 40));
    const username = esc(graph.user.username);

    // Layout: [padding][dot][name ... ][bar][gap][label][padding]
    const labelX = CARD_WIDTH - PADDING - LABEL_WIDTH;
    const barX = labelX - BAR_WIDTH - 8;

    const skillRows = skills
      .map((skill, i) => {
        const y = HEADER_HEIGHT + i * ROW_HEIGHT;
        const level = skill.level || 'beginner';
        const color = skill.category?.color || LEVEL_COLORS[level] || '#6366F1';
        const progress = LEVEL_PROGRESS[level] || 0.25;
        const label = LEVEL_LABELS[level] || 'Beginner';
        const filledWidth = Math.round(BAR_WIDTH * progress);
        const name = esc(truncate(skill.name, 22));

        return `
    <g transform="translate(0, ${y})">
      <circle cx="${PADDING + 6}" cy="18" r="4" fill="${esc(color)}" />
      <text x="${PADDING + 18}" y="22" fill="#E2E8F0" font-size="13" font-family="${FONT}">${name}</text>
      <rect x="${barX}" y="10" width="${BAR_WIDTH}" height="16" rx="4" fill="#1E293B" />
      <rect x="${barX}" y="10" width="${filledWidth}" height="16" rx="4" fill="${esc(color)}" opacity="0.8" />
      <text x="${CARD_WIDTH - PADDING}" y="22" fill="#94A3B8" font-size="10" font-family="${FONT}" text-anchor="end">${esc(label)}</text>
    </g>`;
      })
      .join('');

    const extraRow =
      extraCount > 0
        ? `<text x="${PADDING}" y="${HEADER_HEIGHT + skills.length * ROW_HEIGHT + 22}" fill="#64748B" font-size="12" font-family="${FONT}">+${extraCount} more skills</text>`
        : '';

    const footerY = totalHeight - FOOTER_HEIGHT;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${totalHeight}" viewBox="0 0 ${CARD_WIDTH} ${totalHeight}" fill="none">
  <rect width="${CARD_WIDTH}" height="${totalHeight}" rx="12" fill="#0F172A" />
  <rect width="${CARD_WIDTH}" height="${totalHeight}" rx="12" stroke="#1E293B" stroke-width="1" />

  <!-- Header -->
  <g>
    <text x="${PADDING}" y="32" fill="#F8FAFC" font-size="16" font-weight="600" font-family="${FONT}">${title}</text>
    <text x="${PADDING}" y="52" fill="#94A3B8" font-size="12" font-family="${FONT}">@${username} · ${graph.nodes.length} skills</text>
    <line x1="${PADDING}" y1="64" x2="${CARD_WIDTH - PADDING}" y2="64" stroke="#1E293B" stroke-width="1" />
  </g>

  <!-- Skills -->
  ${skillRows}
  ${extraRow}

  <!-- Footer -->
  <line x1="${PADDING}" y1="${footerY}" x2="${CARD_WIDTH - PADDING}" y2="${footerY}" stroke="#1E293B" stroke-width="1" />
  <text x="${PADDING}" y="${footerY + 20}" fill="#64748B" font-size="11" font-family="${FONT}">⬡ Made with HardGraph</text>
  <text x="${CARD_WIDTH - PADDING}" y="${footerY + 20}" fill="#475569" font-size="10" font-family="${FONT}" text-anchor="end">Create yours →</text>

  <!-- Clickable overlay for GitHub rendering (links are not supported in img src, but useful when SVG opened directly) -->
  <a href="https://hardgraph.io/signup" target="_blank">
    <rect x="${CARD_WIDTH - PADDING - 80}" y="${footerY + 6}" width="80" height="20" fill="transparent" />
  </a>
</svg>`;
  }

  private generateEmptySvg(graph: EmbedGraphData): string {
    const title = esc(truncate(graph.title, 40));
    const username = esc(graph.user.username);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="160" viewBox="0 0 ${CARD_WIDTH} 160" fill="none">
  <rect width="${CARD_WIDTH}" height="160" rx="12" fill="#0F172A" />
  <rect width="${CARD_WIDTH}" height="160" rx="12" stroke="#1E293B" stroke-width="1" />
  <text x="${PADDING}" y="32" fill="#F8FAFC" font-size="16" font-weight="600" font-family="${FONT}">${title}</text>
  <text x="${PADDING}" y="52" fill="#94A3B8" font-size="12" font-family="${FONT}">@${username}</text>
  <line x1="${PADDING}" y1="64" x2="${CARD_WIDTH - PADDING}" y2="64" stroke="#1E293B" stroke-width="1" />
  <text x="${CARD_WIDTH / 2}" y="96" fill="#64748B" font-size="13" font-family="${FONT}" text-anchor="middle">No skills added yet</text>
  <line x1="${PADDING}" y1="116" x2="${CARD_WIDTH - PADDING}" y2="116" stroke="#1E293B" stroke-width="1" />
  <text x="${PADDING}" y="142" fill="#64748B" font-size="11" font-family="${FONT}">⬡ Made with HardGraph</text>
  <text x="${CARD_WIDTH - PADDING}" y="142" fill="#475569" font-size="10" font-family="${FONT}" text-anchor="end">Create yours →</text>
</svg>`;
  }

  generateErrorSvg(message: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="120" viewBox="0 0 ${CARD_WIDTH} 120" fill="none">
  <rect width="${CARD_WIDTH}" height="120" rx="12" fill="#0F172A" />
  <rect width="${CARD_WIDTH}" height="120" rx="12" stroke="#1E293B" stroke-width="1" />
  <text x="${CARD_WIDTH / 2}" y="55" fill="#94A3B8" font-size="14" font-family="${FONT}" text-anchor="middle">${esc(message)}</text>
  <text x="${CARD_WIDTH / 2}" y="80" fill="#64748B" font-size="11" font-family="${FONT}" text-anchor="middle">⬡ hardgraph.io</text>
</svg>`;
  }
}
