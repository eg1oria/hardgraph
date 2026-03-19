import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { GitHubProfile } from './strategies/github.strategy';

/** How long a verification token is valid (24 hours) */
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
/** Minimum wait between resend requests (60 seconds) */
const RESEND_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    let user;
    try {
      user = await this.usersService.create({
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002' &&
        'meta' in error
      ) {
        const target = (error as { meta?: { target?: string[] } }).meta?.target;
        if (target?.includes('email')) throw new ConflictException('Email already in use');
        if (target?.includes('username')) throw new ConflictException('Username already taken');
      }
      throw error;
    }

    // Send verification email — don't block registration if email fails
    try {
      await this.createAndSendVerification(user.id, dto.email);
    } catch (err) {
      this.logger.error(
        `Registration succeeded but verification email failed for ${dto.email}: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }

    const token = this.generateToken(user.id);

    return { user: this.sanitizeUser(user), token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id);

    return { user: this.sanitizeUser(user), token };
  }

  async githubLogin(profile: GitHubProfile) {
    const email = profile.emails?.[0]?.value;
    const avatarUrl = profile.photos?.[0]?.value;

    // 1. Try to find user by githubId
    let user = await this.usersService.findByGithubId(profile.id);

    if (user) {
      // Update access token on each login
      await this.usersService.linkGithub(user.id, {
        githubId: profile.id,
        githubUsername: profile.username,
        githubAccessToken: profile.accessToken,
        avatarUrl: avatarUrl ?? user.avatarUrl ?? undefined,
      });
    } else if (email) {
      // 2. Try to find existing user by email — link GitHub
      const existing = await this.usersService.findByEmail(email);
      if (existing) {
        user = existing;
        await this.usersService.linkGithub(user.id, {
          githubId: profile.id,
          githubUsername: profile.username,
          githubAccessToken: profile.accessToken,
          avatarUrl: avatarUrl ?? user.avatarUrl ?? undefined,
        });
      }
    }

    if (!user) {
      // 3. Create new user
      // Ensure username uniqueness
      let username = profile.username;
      const existingUsername = await this.usersService.findByUsername(username);
      if (existingUsername) {
        username = `${username}-${profile.id.slice(-4)}`;
      }

      try {
        user = await this.usersService.create({
          email: email || `${profile.id}@github.oauth`,
          username,
          displayName: profile.displayName || profile.username,
          githubId: profile.id,
          githubUsername: profile.username,
          githubAccessToken: profile.accessToken,
          avatarUrl,
          emailVerified: true,
        });
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          // Race condition: another request created the user. Try to find them.
          user = await this.usersService.findByGithubId(profile.id);
          if (!user && email) {
            user = await this.usersService.findByEmail(email);
          }
          if (!user) throw new ConflictException('Account creation conflict, please try again');
        } else {
          throw error;
        }
      }
    }

    const token = this.generateToken(user.id);
    return { user: this.sanitizeUser(user), token };
  }

  generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  /** Verify an email address using a token from the verification email */
  async verifyEmail(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash },
    });

    if (!record) {
      throw new BadRequestException('Invalid verification link');
    }

    if (record.usedAt) {
      throw new BadRequestException('This link has already been used');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Verification link has expired. Please request a new one.');
    }

    // Mark token as used and verify user in a transaction
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  /** Resend verification email with rate limiting */
  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return { message: 'If that email is registered, a verification link has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    // Rate limit: check if a token was created recently
    const recentToken = await this.prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentToken) {
      throw new BadRequestException('Please wait before requesting another verification email.');
    }

    await this.createAndSendVerification(user.id, user.email);
    return { message: 'If that email is registered, a verification link has been sent.' };
  }

  /** Generate a secure token, store its hash, and send the verification email */
  private async createAndSendVerification(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
      },
    });

    await this.mailService.sendVerificationEmail(email, rawToken);
  }

  /** SHA-256 hash a raw token for storage */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      passwordHash: _,
      githubAccessToken: _t,
      ...sanitized
    } = user as Record<string, unknown> & {
      passwordHash?: string;
      githubAccessToken?: string;
    };
    return sanitized;
  }
}
