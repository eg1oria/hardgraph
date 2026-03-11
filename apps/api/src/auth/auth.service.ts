import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { GitHubProfile } from './strategies/github.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      displayName: dto.displayName,
    });

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

      user = await this.usersService.create({
        email: email || `${profile.id}@github.oauth`,
        username,
        displayName: profile.displayName || profile.username,
        githubId: profile.id,
        githubUsername: profile.username,
        githubAccessToken: profile.accessToken,
        avatarUrl,
      });
    }

    const token = this.generateToken(user.id);
    return { user: this.sanitizeUser(user), token };
  }

  generateToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  private sanitizeUser(user: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, githubAccessToken: _t, ...sanitized } = user as Record<string, unknown> & {
      passwordHash?: string;
      githubAccessToken?: string;
    };
    return sanitized;
  }
}
