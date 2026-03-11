import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Post(':id/use')
  @UseGuards(JwtAuthGuard)
  useTemplate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.templatesService.useTemplate(id, userId);
  }
}
