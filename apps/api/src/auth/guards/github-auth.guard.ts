import { Injectable, ExecutionContext, BadRequestException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class GitHubAuthGuard extends AuthGuard('github') {
  private readonly logger = new Logger(GitHubAuthGuard.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    if (!clientId) {
      this.logger.error(
        'GitHub OAuth attempted but GITHUB_CLIENT_ID is not set. ' +
          'Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_CALLBACK_URL in .env',
      );
      throw new BadRequestException('GitHub OAuth is not configured');
    }

    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');
    if (!clientSecret) {
      this.logger.error(
        'GitHub OAuth attempted but GITHUB_CLIENT_SECRET is not set. ' +
          'Token exchange will fail without a valid secret.',
      );
      throw new BadRequestException('GitHub OAuth is not configured');
    }

    return super.canActivate(context);
  }

  handleRequest<T>(err: Error | null, user: T, info: unknown, context: ExecutionContext): T {
    if (err || !user) {
      const message = err?.message || 'GitHub authentication failed';
      this.logger.error(`GitHub OAuth failed: ${message}`);
      if (err?.stack) {
        this.logger.debug(err.stack);
      }
      // Attach error to request so the controller can redirect with error info
      const req = context.switchToHttp().getRequest<Request>();
      (req as unknown as Record<string, unknown>).authError = message;
      return null as T;
    }
    return user;
  }
}
