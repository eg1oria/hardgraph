import { Injectable } from '@nestjs/common';
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
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GITHUB_CLIENT_ID', '');
    const clientSecret = config.get<string>('GITHUB_CLIENT_SECRET', '');

    super({
      clientID: clientID || 'disabled',
      clientSecret: clientSecret || 'disabled',
      callbackURL: config.get<string>(
        'GITHUB_CALLBACK_URL',
        'http://localhost:4000/api/auth/github/callback',
      ),
      scope: ['user:email'],
    });
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
