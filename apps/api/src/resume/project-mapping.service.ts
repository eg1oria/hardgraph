import { Injectable } from '@nestjs/common';
import type { ResumeProject } from './resume.types';

interface NodeInput {
  id: string;
  name: string;
  description?: string | null;
  nodeType: string;
  customData?: Record<string, unknown> | null;
}

interface EdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
}

@Injectable()
export class ProjectMappingService {
  /**
   * Extracts projects from repository nodes with their connected skill nodes as tech stack.
   */
  map(nodes: NodeInput[], edges: EdgeInput[]): ResumeProject[] {
    const repoNodes = nodes.filter((n) => n.nodeType === 'repository');
    if (repoNodes.length === 0) return [];

    // Build adjacency: nodeId -> connected node ids
    const adjacency = new Map<string, Set<string>>();
    for (const edge of edges) {
      if (!adjacency.has(edge.sourceNodeId)) adjacency.set(edge.sourceNodeId, new Set());
      if (!adjacency.has(edge.targetNodeId)) adjacency.set(edge.targetNodeId, new Set());
      adjacency.get(edge.sourceNodeId)!.add(edge.targetNodeId);
      adjacency.get(edge.targetNodeId)!.add(edge.sourceNodeId);
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    return repoNodes.map((repo) => {
      const connectedIds = adjacency.get(repo.id) ?? new Set();
      const tech: string[] = [];
      for (const connId of connectedIds) {
        const connNode = nodeMap.get(connId);
        if (connNode && connNode.nodeType === 'skill') {
          tech.push(connNode.name);
        }
      }

      // Use language from customData as fallback tech
      const customData = repo.customData ?? {};
      if (tech.length === 0 && typeof customData.language === 'string' && customData.language) {
        tech.push(customData.language);
      }

      const link = typeof customData.repoUrl === 'string' ? customData.repoUrl : undefined;

      return {
        name: repo.name,
        description: repo.description ?? undefined,
        tech,
        link,
      };
    });
  }
}
