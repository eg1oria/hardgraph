import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResumeService } from './resume.service';

@ApiTags('Resume')
@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get(':username/:slug')
  getResume(@Param('username') username: string, @Param('slug') slug: string) {
    return this.resumeService.generateResume(username, slug);
  }
}
