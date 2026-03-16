import { Controller, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateService } from './generate.service';

@ApiTags('Generate')
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('from-github')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  generateFromGithub(@Req() req: { user: { id: string } }) {
    return this.generateService.generateSkillTree(req.user.id);
  }
}
