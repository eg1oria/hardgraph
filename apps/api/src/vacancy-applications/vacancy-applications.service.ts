import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { computeMatchScore } from '../common/utils/skill-matcher';

@Injectable()
export class VacancyApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(vacancyId: string, applicantId: string, dto: CreateApplicationDto) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    if (!vacancy.isActive) throw new BadRequestException('Vacancy is no longer active');
    if (vacancy.authorId === applicantId)
      throw new ForbiddenException('You cannot apply to your own vacancy');

    const existing = await this.prisma.vacancyApplication.findUnique({
      where: { vacancyId_applicantId: { vacancyId, applicantId } },
    });
    if (existing) throw new ConflictException('You have already applied to this vacancy');

    // Verify graph belongs to applicant and load nodes for matching
    const graph = await this.prisma.graph.findUnique({
      where: { id: dto.graphId },
      include: { nodes: { select: { name: true, level: true } } },
    });
    if (!graph) throw new NotFoundException('Graph not found');
    if (graph.userId !== applicantId)
      throw new ForbiddenException('You can only apply with your own graph');

    // Compute match score via shared utility
    const vacancySkills = (vacancy.skills as unknown as { name: string; level: string }[]) ?? [];
    const match = computeMatchScore(vacancySkills, graph.nodes);

    try {
      return await this.prisma.vacancyApplication.create({
        data: {
          vacancyId,
          applicantId,
          graphId: dto.graphId,
          coverLetter: dto.coverLetter,
          matchScore: match.matchScore,
          matchedSkills: match.matchedCount,
          totalRequired: match.totalRequired,
        },
        include: {
          vacancy: { select: { id: true, title: true, company: true } },
          applicant: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          graph: { select: { id: true, title: true, slug: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already applied to this vacancy');
      }
      throw error;
    }
  }

  async findByVacancy(vacancyId: string, userId: string, query: QueryApplicationsDto) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    if (vacancy.authorId !== userId)
      throw new ForbiddenException('Only the vacancy author can view applications');

    const where: Prisma.VacancyApplicationWhereInput = { vacancyId };
    if (query.status) where.status = query.status;

    const orderBy: Prisma.VacancyApplicationOrderByWithRelationInput = {};
    const sortField = query.sort === 'matchScore' ? 'matchScore' : 'createdAt';
    orderBy[sortField] = query.order === 'asc' ? 'asc' : 'desc';

    return this.prisma.vacancyApplication.findMany({
      where,
      orderBy,
      include: {
        applicant: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        graph: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async findMine(applicantId: string) {
    return this.prisma.vacancyApplication.findMany({
      where: { applicantId },
      orderBy: { createdAt: 'desc' },
      include: {
        vacancy: {
          select: {
            id: true,
            title: true,
            company: true,
            field: true,
            location: true,
            isActive: true,
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
        graph: { select: { id: true, title: true } },
      },
    });
  }

  async updateStatus(
    vacancyId: string,
    applicationId: string,
    userId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    if (vacancy.authorId !== userId)
      throw new ForbiddenException('Only the vacancy author can update application status');

    const application = await this.prisma.vacancyApplication.findFirst({
      where: { id: applicationId, vacancyId },
    });
    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.vacancyApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        hrNote: dto.hrNote ?? application.hrNote,
        reviewedAt: new Date(),
      },
      include: {
        applicant: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        graph: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async withdraw(vacancyId: string, applicationId: string, applicantId: string) {
    const application = await this.prisma.vacancyApplication.findFirst({
      where: { id: applicationId, vacancyId, applicantId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'pending')
      throw new BadRequestException('Can only withdraw pending applications');

    await this.prisma.vacancyApplication.delete({ where: { id: applicationId } });
    return { deleted: true };
  }

  async getVacancyAnalytics(vacancyId: string, userId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    if (vacancy.authorId !== userId)
      throw new ForbiddenException('Only the vacancy author can view analytics');

    const applications = await this.prisma.vacancyApplication.findMany({
      where: { vacancyId },
      include: {
        applicant: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        graph: { select: { id: true, title: true } },
      },
      orderBy: { matchScore: 'desc' },
    });

    const totalApplications = applications.length;

    // Status breakdown
    const statusCounts = new Map<string, number>();
    for (const app of applications) {
      statusCounts.set(app.status, (statusCounts.get(app.status) ?? 0) + 1);
    }
    const statusBreakdown = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0,
    }));

    // Average match score
    const averageMatchScore =
      totalApplications > 0
        ? Math.round(applications.reduce((sum, a) => sum + a.matchScore, 0) / totalApplications)
        : 0;

    // Match score distribution
    const ranges = [
      { range: '0-25%', min: 0, max: 25 },
      { range: '26-50%', min: 26, max: 50 },
      { range: '51-75%', min: 51, max: 75 },
      { range: '76-100%', min: 76, max: 100 },
    ];
    const matchScoreDistribution = ranges.map(({ range, min, max }) => {
      const count = applications.filter((a) => a.matchScore >= min && a.matchScore <= max).length;
      return {
        range,
        count,
        percentage: totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0,
      };
    });

    // Top 5 candidates
    const topCandidates = applications.slice(0, 5).map((a) => ({
      applicantId: a.applicantId,
      username: a.applicant.username,
      displayName: a.applicant.displayName,
      avatarUrl: a.applicant.avatarUrl,
      matchScore: a.matchScore,
      graphTitle: a.graph.title,
      status: a.status,
    }));

    // Skill gap analysis — compute from graph nodes for accuracy
    const vacancySkills = (vacancy.skills as unknown as { name: string }[]) ?? [];

    // Build a map: for each required skill → count of applicants who have it
    const skillGapMap = new Map<string, number>();
    for (const reqSkill of vacancySkills) {
      skillGapMap.set(reqSkill.name.toLowerCase(), 0);
    }

    // Check each applicant's graph nodes against required skills
    const graphIds = [...new Set(applications.map((a) => a.graphId))];
    if (graphIds.length > 0) {
      const nodes = await this.prisma.node.findMany({
        where: { graphId: { in: graphIds } },
        select: { graphId: true, name: true },
      });

      const graphNodeMap = new Map<string, Set<string>>();
      for (const node of nodes) {
        if (!graphNodeMap.has(node.graphId)) graphNodeMap.set(node.graphId, new Set());
        graphNodeMap.get(node.graphId)!.add(node.name.toLowerCase());
      }

      for (const app of applications) {
        const nodeNames = graphNodeMap.get(app.graphId);
        if (!nodeNames) continue;
        for (const reqSkill of vacancySkills) {
          if (nodeNames.has(reqSkill.name.toLowerCase())) {
            skillGapMap.set(
              reqSkill.name.toLowerCase(),
              (skillGapMap.get(reqSkill.name.toLowerCase()) ?? 0) + 1,
            );
          }
        }
      }
    }

    const skillGapAnalysis = vacancySkills.map((reqSkill) => {
      const matchedCount = skillGapMap.get(reqSkill.name.toLowerCase()) ?? 0;
      return {
        skillName: reqSkill.name,
        matchedCount,
        totalApplications,
        matchPercentage:
          totalApplications > 0 ? Math.round((matchedCount / totalApplications) * 100) : 0,
      };
    });

    // Application timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const timelineApps = applications.filter((a) => a.createdAt >= thirtyDaysAgo);
    const dateMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      dateMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const app of timelineApps) {
      const key = app.createdAt.toISOString().slice(0, 10);
      if (dateMap.has(key)) dateMap.set(key, dateMap.get(key)! + 1);
    }
    const applicationTimeline = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Average time to review (in hours)
    const reviewedApps = applications.filter((a) => a.reviewedAt);
    const averageTimeToReview =
      reviewedApps.length > 0
        ? Math.round(
            reviewedApps.reduce((sum, a) => {
              const diff = a.reviewedAt!.getTime() - a.createdAt.getTime();
              return sum + diff / (1000 * 60 * 60);
            }, 0) / reviewedApps.length,
          )
        : null;

    return {
      totalApplications,
      statusBreakdown,
      averageMatchScore,
      matchScoreDistribution,
      topCandidates,
      skillGapAnalysis: skillGapAnalysis,
      applicationTimeline,
      averageTimeToReview,
    };
  }

  async getOverviewAnalytics(userId: string) {
    const vacancies = await this.prisma.vacancy.findMany({
      where: { authorId: userId },
      select: { id: true, title: true, company: true, isActive: true },
    });

    const vacancyIds = vacancies.map((v) => v.id);
    const totalVacancies = vacancies.length;
    const activeVacancies = vacancies.filter((v) => v.isActive).length;

    if (vacancyIds.length === 0) {
      return {
        totalVacancies: 0,
        activeVacancies: 0,
        totalApplications: 0,
        pendingApplications: 0,
        averageMatchScore: 0,
        acceptanceRate: 0,
        topVacanciesByApplications: [],
        statusOverview: [],
        recentApplications: [],
      };
    }

    const allApplications = await this.prisma.vacancyApplication.findMany({
      where: { vacancyId: { in: vacancyIds } },
      include: {
        vacancy: { select: { id: true, title: true, company: true } },
        applicant: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalApplications = allApplications.length;
    const pendingApplications = allApplications.filter((a) => a.status === 'pending').length;
    const averageMatchScore =
      totalApplications > 0
        ? Math.round(allApplications.reduce((sum, a) => sum + a.matchScore, 0) / totalApplications)
        : 0;
    const acceptedCount = allApplications.filter((a) => a.status === 'accepted').length;
    const acceptanceRate =
      totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0;

    // Top vacancies by applications
    const vacancyAppCounts = new Map<string, { count: number; totalScore: number }>();
    for (const app of allApplications) {
      const entry = vacancyAppCounts.get(app.vacancyId) ?? { count: 0, totalScore: 0 };
      entry.count++;
      entry.totalScore += app.matchScore;
      vacancyAppCounts.set(app.vacancyId, entry);
    }
    const topVacanciesByApplications = vacancies
      .map((v) => {
        const entry = vacancyAppCounts.get(v.id);
        return {
          vacancyId: v.id,
          title: v.title,
          company: v.company,
          applicationsCount: entry?.count ?? 0,
          avgMatchScore: entry ? Math.round(entry.totalScore / entry.count) : 0,
        };
      })
      .sort((a, b) => b.applicationsCount - a.applicationsCount)
      .slice(0, 10);

    // Status overview
    const statusCounts = new Map<string, number>();
    for (const app of allApplications) {
      statusCounts.set(app.status, (statusCounts.get(app.status) ?? 0) + 1);
    }
    const statusOverview = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0,
    }));

    // Recent applications
    const recentApplications = allApplications.slice(0, 10).map((a) => ({
      id: a.id,
      vacancyTitle: a.vacancy.title,
      applicantUsername: a.applicant.username,
      matchScore: a.matchScore,
      status: a.status,
      createdAt: a.createdAt,
    }));

    return {
      totalVacancies,
      activeVacancies,
      totalApplications,
      pendingApplications,
      averageMatchScore,
      acceptanceRate,
      topVacanciesByApplications,
      statusOverview,
      recentApplications,
    };
  }

  /** Check if user already applied to a vacancy */
  async hasApplied(vacancyId: string, applicantId: string) {
    const app = await this.prisma.vacancyApplication.findUnique({
      where: { vacancyId_applicantId: { vacancyId, applicantId } },
      select: { id: true, status: true },
    });
    return app;
  }
}
