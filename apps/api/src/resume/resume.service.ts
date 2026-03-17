import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleDetectionService } from './role-detection.service';
import { SkillExtractionService } from './skill-extraction.service';
import { ProjectMappingService } from './project-mapping.service';
import type { ResumeData } from './resume.types';

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleDetection: RoleDetectionService,
    private readonly skillExtraction: SkillExtractionService,
    private readonly projectMapping: ProjectMappingService,
  ) {}

  async generateResume(username: string, slug: string): Promise<ResumeData> {
    const graph = await this.prisma.graph.findFirst({
      where: {
        slug,
        isPublic: true,
        user: { username },
      },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            githubUsername: true,
            websiteUrl: true,
            linkedinUrl: true,
            twitterHandle: true,
          },
        },
        nodes: true,
        edges: true,
      },
    });

    if (!graph) throw new NotFoundException('Graph not found');

    const nodes = graph.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      description: n.description,
      level: n.level,
      nodeType: n.nodeType,
      customData: n.customData as Record<string, unknown> | null,
      endorsementCount: n.endorsementCount,
    }));

    const edges = graph.edges.map((e) => ({
      sourceNodeId: e.sourceNodeId,
      targetNodeId: e.targetNodeId,
    }));

    // 1. Role detection
    const { title } = this.roleDetection.detect(nodes);

    // 2. Skill extraction
    const skills = this.skillExtraction.extract(nodes);

    // 3. Project mapping
    const projects = this.projectMapping.map(nodes, edges);

    // 4. Summary (template-based)
    const topSkills = skills.slice(0, 5).join(', ');
    const summary = topSkills
      ? `${title} with experience in ${topSkills}. Focused on building modern applications and continuously improving skills.`
      : `${title} focused on building modern applications and continuously improving skills.`;

    // 5. Contacts
    const user = graph.user;
    const contacts: ResumeData['contacts'] = {};
    if (user.githubUsername) {
      contacts.github = `https://github.com/${user.githubUsername}`;
    }
    if (user.websiteUrl) {
      contacts.website = user.websiteUrl;
    }
    if (user.linkedinUrl) {
      contacts.linkedin = user.linkedinUrl;
    }
    if (user.twitterHandle) {
      contacts.twitter = `https://twitter.com/${user.twitterHandle}`;
    }

    return {
      name: user.displayName || user.username,
      title,
      summary,
      skills,
      projects,
      contacts,
      graphTitle: graph.title,
      graphSlug: graph.slug,
      username: user.username,
    };
  }
}
