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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import type { GitHubProfile } from './strategies/github.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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
    if (!this.configService.get('GITHUB_CLIENT_ID')) {
      throw new BadRequestException('GitHub OAuth is not configured');
    }
    // Passport redirects to GitHub — this never executes
  }

  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GitHubProfile;
    const { token } = await this.authService.githubLogin(profile);
    const frontendUrl = this.configService.get<string>(
      'NEXT_PUBLIC_APP_URL',
      'http://localhost:3000',
    );
    res.redirect(`${frontendUrl}/auth/github/callback?token=${encodeURIComponent(token)}`);
  }
}
