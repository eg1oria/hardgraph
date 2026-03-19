import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GapAnalysisService } from './gap-analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GapAnalysisTargetsQueryDto } from './dto/gap-analysis-query.dto';

@ApiTags('Gap Analysis')
@Controller('gap-analysis')
export class GapAnalysisController {
  constructor(private readonly gapAnalysisService: GapAnalysisService) {}

  @Get('targets')
  @Throttle({ short: { ttl: 60_000, limit: 30 } })
  getTargets(@Query() query: GapAnalysisTargetsQueryDto) {
    return this.gapAnalysisService.getAvailableTargets(query.field);
  }

  @Get(':graphId/:templateId')
  @Throttle({ short: { ttl: 60_000, limit: 20 } })
  @UseGuards(JwtAuthGuard)
  analyze(
    @Param('graphId', ParseUUIDPipe) graphId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.gapAnalysisService.analyze(graphId, templateId, userId);
  }
}
