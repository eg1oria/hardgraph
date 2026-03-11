import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        githubUsername: true,
        plan: true,
        role: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  /** Full user record for internal auth — includes passwordHash */
  async findByEmailFull(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash?: string;
    displayName?: string;
    githubId?: string;
    githubUsername?: string;
    githubAccessToken?: string;
    avatarUrl?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async findByGithubId(githubId: string) {
    return this.prisma.user.findFirst({ where: { githubId } });
  }

  async linkGithub(
    userId: string,
    data: {
      githubId: string;
      githubUsername: string;
      githubAccessToken: string;
      avatarUrl?: string;
    },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        githubUsername: true,
        websiteUrl: true,
        twitterHandle: true,
        linkedinUrl: true,
        createdAt: true,
        graphs: {
          where: { isPublic: true },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            theme: true,
            viewCount: true,
            isPrimary: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }
}
