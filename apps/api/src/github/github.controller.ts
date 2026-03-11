import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GithubService } from './github.service';

@ApiTags('GitHub')
@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('repos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getRepos(@Req() req: { user: { id: string } }) {
    return this.githubService.getRepos(req.user.id);
  }

  @Get('repos/public/:username')
  getPublicRepos(@Param('username') username: string) {
    return this.githubService.getPublicReposByUsername(username);
  }
}
