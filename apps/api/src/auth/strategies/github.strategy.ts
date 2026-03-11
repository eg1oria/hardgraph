import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

export interface GitHubProfile {
  id: string;
  username: string;
  displayName: string;
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
  accessToken: string;
}

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GitHubStrategy.name);

  constructor(config: ConfigService) {
    const clientID = config.get<string>('GITHUB_CLIENT_ID') || '';
    const clientSecret = config.get<string>('GITHUB_CLIENT_SECRET') || '';
    const callbackURL =
      config.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:4000/api/auth/github/callback';

    if (!clientID || !clientSecret) {
      const logger = new Logger(GitHubStrategy.name);
      logger.warn(
        'GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set — GitHub OAuth will not work. ' +
          'Set both env vars and restart the server.',
      );
    }

    super({
      clientID: clientID || 'placeholder-not-configured',
      clientSecret: clientSecret || 'placeholder-not-configured',
      callbackURL,
      scope: ['user:email'],
    });

    this.logger.log(
      `GitHub OAuth configured: callbackURL=${callbackURL}, clientID=${clientID ? clientID.slice(0, 4) + '...' : '(empty)'}`,
    );
  }

  validate(accessToken: string, _refreshToken: string, profile: Profile): GitHubProfile {
    return {
      id: profile.id,
      username: profile.username ?? profile.displayName,
      displayName: profile.displayName ?? profile.username ?? '',
      emails: profile.emails ?? [],
      photos: profile.photos ?? [],
      accessToken,
    };
  }
}
