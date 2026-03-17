import { Injectable } from '@nestjs/common';

const LEVEL_ORDER: Record<string, number> = {
  expert: 4,
  advanced: 3,
  intermediate: 2,
  beginner: 1,
};

interface NodeInput {
  name: string;
  level: string;
  nodeType: string;
  endorsementCount?: number;
}

@Injectable()
export class SkillExtractionService {
  /**
   * Extracts and ranks skill nodes, returning top N skill names.
   */
  extract(nodes: NodeInput[], limit = 12): string[] {
    const skillNodes = nodes.filter((n) => n.nodeType === 'skill');

    const sorted = [...skillNodes].sort((a, b) => {
      // First sort by level (expert > advanced > intermediate > beginner)
      const levelDiff = (LEVEL_ORDER[b.level] ?? 0) - (LEVEL_ORDER[a.level] ?? 0);
      if (levelDiff !== 0) return levelDiff;
      // Then by endorsement count
      return (b.endorsementCount ?? 0) - (a.endorsementCount ?? 0);
    });

    return sorted.slice(0, limit).map((n) => n.name);
  }
}
