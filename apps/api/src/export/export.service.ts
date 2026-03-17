import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Resvg } from '@resvg/resvg-js';

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

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

interface ExportNode {
  name: string;
  description: string | null;
  level: string;
  nodeType: string;
  icon: string | null;
  positionX: number;
  positionY: number;
  category: { name: string; color: string | null } | null;
}

interface ExportGraph {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  userId: string;
  isPublic: boolean;
  updatedAt: Date;
  user: { username: string; displayName: string | null };
  nodes: ExportNode[];
  edges: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    label: string | null;
    edgeType: string;
  }>;
  categories: Array<{ name: string; color: string | null; sortOrder: number }>;
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  private async getGraph(graphId: string, userId?: string): Promise<ExportGraph> {
    const graph = await this.prisma.graph.findUnique({
      where: { id: graphId },
      include: {
        user: { select: { username: true, displayName: true } },
        nodes: {
          include: { category: { select: { name: true, color: true } } },
          orderBy: { createdAt: 'asc' },
        },
        edges: {
          select: { sourceNodeId: true, targetNodeId: true, label: true, edgeType: true },
        },
        categories: {
          select: { name: true, color: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!graph) throw new NotFoundException('Graph not found');

    if (userId) {
      if (graph.userId !== userId) throw new ForbiddenException();
    } else {
      if (!graph.isPublic) throw new NotFoundException('Graph not found');
    }

    return graph;
  }

  async getPublicGraph(username: string, slug: string): Promise<ExportGraph> {
    const graph = await this.prisma.graph.findFirst({
      where: { slug, isPublic: true, user: { username } },
      include: {
        user: { select: { username: true, displayName: true } },
        nodes: {
          include: { category: { select: { name: true, color: true } } },
          orderBy: { createdAt: 'asc' },
        },
        edges: {
          select: { sourceNodeId: true, targetNodeId: true, label: true, edgeType: true },
        },
        categories: {
          select: { name: true, color: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!graph) throw new NotFoundException('Graph not found');
    return graph;
  }

  async exportJSON(graphId: string, userId: string) {
    const graph = await this.getGraph(graphId, userId);

    return {
      title: graph.title,
      description: graph.description,
      nodes: graph.nodes.map((n) => ({
        name: n.name,
        description: n.description,
        level: n.level,
        nodeType: n.nodeType,
        icon: n.icon,
        positionX: n.positionX,
        positionY: n.positionY,
        category: n.category ? { name: n.category.name, color: n.category.color } : null,
      })),
      edges: graph.edges.map((e) => ({
        sourceNodeId: e.sourceNodeId,
        targetNodeId: e.targetNodeId,
        label: e.label,
        edgeType: e.edgeType,
      })),
      categories: graph.categories.map((c) => ({
        name: c.name,
        color: c.color,
        sortOrder: c.sortOrder,
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  async exportSVG(graphId: string, userId: string, watermark: boolean): Promise<string> {
    const graph = await this.getGraph(graphId, userId);
    return this.generateFullSvg(graph, watermark);
  }

  async exportPublicSVG(username: string, slug: string): Promise<string> {
    const graph = await this.getPublicGraph(username, slug);
    return this.generateFullSvg(graph, true);
  }

  async exportPNG(
    graphId: string,
    userId: string,
    watermark: boolean,
    width = 1200,
  ): Promise<Buffer> {
    const graph = await this.getGraph(graphId, userId);
    const svg = this.generateFullSvg(graph, watermark);
    return this.svgToPng(svg, width);
  }

  async exportPublicPNG(username: string, slug: string, width = 1200): Promise<Buffer> {
    const graph = await this.getPublicGraph(username, slug);
    const svg = this.generateFullSvg(graph, true);
    return this.svgToPng(svg, width);
  }

  private svgToPng(svg: string, width: number): Buffer {
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: Math.min(Math.max(width, 400), 2400) },
    });
    const pngData = resvg.render();
    return Buffer.from(pngData.asPng());
  }

  private generateFullSvg(graph: ExportGraph, watermark: boolean): string {
    const W = 800;
    const PAD = 32;
    const ROW_H = 44;
    const HEADER_H = 96;
    const CAT_HEADER_H = 40;
    const FOOTER_H = watermark ? 56 : 20;

    const categorized = new Map<string, { color: string; nodes: ExportNode[] }>();
    const uncategorized: ExportNode[] = [];

    for (const node of graph.nodes) {
      if (node.category) {
        const key = node.category.name;
        if (!categorized.has(key)) {
          categorized.set(key, { color: node.category.color || '#6366F1', nodes: [] });
        }
        categorized.get(key)!.nodes.push(node);
      } else {
        uncategorized.push(node);
      }
    }

    let totalRows = 0;
    const sections: Array<{ title: string; color: string; nodes: ExportNode[] }> = [];

    for (const [title, data] of categorized) {
      sections.push({ title, color: data.color, nodes: data.nodes });
      totalRows += 1 + data.nodes.length; // category header + nodes
    }

    if (uncategorized.length > 0) {
      sections.push({ title: 'Other', color: '#64748B', nodes: uncategorized });
      totalRows += 1 + uncategorized.length;
    }

    if (sections.length === 0) {
      totalRows = 1; // "No skills" message
    }

    const contentH = totalRows * ROW_H;
    const H = HEADER_H + contentH + FOOTER_H + 24;

    const title = esc(truncate(graph.title, 50));
    const username = esc(graph.user.username);
    const displayName = graph.user.displayName ? esc(truncate(graph.user.displayName, 30)) : null;
    const barX = PAD;
    const barW = W - PAD * 2;

    let currentY = HEADER_H;
    let skillRows = '';

    for (const section of sections) {
      // Category header
      skillRows += `
    <g transform="translate(0, ${currentY})">
      <rect x="${PAD - 4}" y="0" width="${barW + 8}" height="${CAT_HEADER_H - 8}" rx="6" fill="${esc(section.color)}0D" />
      <text x="${PAD + 8}" y="22" fill="${esc(section.color)}" font-size="12" font-weight="700" font-family="${FONT}" letter-spacing="0.5">${esc(section.title.toUpperCase())}</text>
      <text x="${W - PAD - 4}" y="22" fill="#475569" font-size="10" font-family="${FONT}" text-anchor="end">${section.nodes.length} skills</text>
    </g>`;
      currentY += ROW_H;

      for (const skill of section.nodes) {
        const level = skill.level || 'beginner';
        const color = skill.category?.color || LEVEL_COLORS[level] || '#818CF8';
        const progress = LEVEL_PROGRESS[level] || 0.25;
        const label = LEVEL_LABELS[level] || 'Beginner';
        const icon = LEVEL_ICONS[level] || '○';
        const filledW = Math.round(barW * progress);
        const name = esc(truncate(skill.name, 40));
        const gradId = `bar${currentY}`;

        skillRows += `
    <g transform="translate(0, ${currentY})">
      <text x="${PAD}" y="16" fill="${esc(color)}" font-size="11" font-family="${FONT}">${icon}</text>
      <text x="${PAD + 18}" y="16" fill="#E2E8F0" font-size="13" font-weight="500" font-family="${FONT}">${name}</text>
      <text x="${W - PAD}" y="16" fill="#64748B" font-size="9" font-weight="500" font-family="${FONT}" letter-spacing="0.5" text-anchor="end">${esc(label.toUpperCase())}</text>
      <rect x="${barX}" y="26" width="${barW}" height="5" rx="2.5" fill="#1E293B" />
      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${esc(color)}" stop-opacity="0.6" />
        <stop offset="100%" stop-color="${esc(color)}" />
      </linearGradient>
      <rect x="${barX}" y="26" width="${filledW}" height="5" rx="2.5" fill="url(#${gradId})" />
    </g>`;
        currentY += ROW_H;
      }
    }

    if (sections.length === 0) {
      skillRows = `<text x="${W / 2}" y="${HEADER_H + 30}" fill="#475569" font-size="13" font-weight="500" font-family="${FONT}" text-anchor="middle">No skills yet</text>`;
    }

    const footerY = H - FOOTER_H;

    const watermarkBlock = watermark
      ? `
  <!-- Footer -->
  <line x1="${PAD}" y1="${footerY}" x2="${W - PAD}" y2="${footerY}" stroke="#1E293B" stroke-width="1" />
  <g transform="translate(0, ${footerY})">
    <g transform="translate(${PAD}, 14)">
      <polygon points="8,0 14.93,4 14.93,12 8,16 1.07,12 1.07,4" fill="none" stroke="#6366F1" stroke-width="1.2" opacity="0.6" />
      <polygon points="8,3 11.46,5 11.46,11 8,13 4.54,11 4.54,5" fill="#6366F1" opacity="0.15" />
    </g>
    <text x="${PAD + 22}" y="27" fill="#475569" font-size="11" font-weight="500" font-family="${FONT}">Made with HardGraph</text>
    <text x="${W - PAD}" y="27" fill="#334155" font-size="10" font-weight="500" font-family="${FONT}" text-anchor="end">hardgraph.io</text>
  </g>`
      : '';

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

  <!-- Header -->
  <g>
    <text x="${PAD}" y="40" fill="#F8FAFC" font-size="20" font-weight="700" font-family="${FONT}" letter-spacing="-0.3">${title}</text>
    <text x="${PAD}" y="62" fill="#64748B" font-size="12" font-weight="400" font-family="${FONT}">${displayName ? displayName + ' · ' : ''}@${username}</text>
    <text x="${W - PAD}" y="62" fill="#475569" font-size="11" font-weight="500" font-family="${FONT}" text-anchor="end">${graph.nodes.length} skills · ${graph.edges.length} connections</text>
    <line x1="${PAD}" y1="78" x2="${W - PAD}" y2="78" stroke="#1E293B" stroke-width="1" />
  </g>

  <!-- Skills by category -->
  ${skillRows}
  ${watermarkBlock}
</svg>`;
  }
}
