import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import type { GitHubProfile } from './strategies/github.strategy';

const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const raw = this.configService.get<string>('NEXT_PUBLIC_APP_URL') || '';
    this.frontendUrl = this.sanitizeUrl(raw) || DEFAULT_FRONTEND_URL;

    if (!raw) {
      this.logger.warn(
        `NEXT_PUBLIC_APP_URL is not set — using fallback "${this.frontendUrl}" for OAuth redirects`,
      );
    }
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('github')
  @UseGuards(GitHubAuthGuard)
  github() {
    // Passport redirects to GitHub — this never executes
  }

  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const authError = (req as unknown as Record<string, unknown>).authError as string | undefined;
    if (authError) {
      this.logger.warn(`GitHub OAuth callback error, redirecting user to login: ${authError}`);
      return res.redirect(
        `${this.frontendUrl}/login?error=${encodeURIComponent('GitHub authentication failed. Please try again.')}`,
      );
    }

    try {
      const profile = req.user as GitHubProfile;
      if (!profile?.id) {
        this.logger.error('GitHub OAuth callback: profile is missing after successful auth');
        return res.redirect(
          `${this.frontendUrl}/login?error=${encodeURIComponent('GitHub authentication failed. Please try again.')}`,
        );
      }

      const { token } = await this.authService.githubLogin(profile);
      return res.redirect(
        `${this.frontendUrl}/auth/github/callback?token=${encodeURIComponent(token)}`,
      );
    } catch (err) {
      this.logger.error(
        `GitHub OAuth callback: failed to process login — ${err instanceof Error ? err.message : 'unknown error'}`,
      );
      return res.redirect(
        `${this.frontendUrl}/login?error=${encodeURIComponent('Failed to complete GitHub sign-in. Please try again.')}`,
      );
    }
  }

  /** Ensure URL has a valid protocol and strip trailing slashes */
  private sanitizeUrl(url: string): string {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.origin + parsed.pathname.replace(/\/+$/, '');
    } catch {
      return '';
    }
  }
}
