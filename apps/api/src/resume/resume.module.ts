import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { RoleDetectionService } from './role-detection.service';
import { SkillExtractionService } from './skill-extraction.service';
import { ProjectMappingService } from './project-mapping.service';

@Module({
  controllers: [ResumeController],
  providers: [ResumeService, RoleDetectionService, SkillExtractionService, ProjectMappingService],
  exports: [ResumeService],
})
export class ResumeModule {}
