import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TrackViewDto } from './dto/track-view.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @Throttle({ short: { ttl: 60_000, limit: 30 } })
  @UseGuards(OptionalAuthGuard)
  track(@Body() dto: TrackViewDto, @Req() req: Request, @CurrentUser('id') userId?: string) {
    // trust proxy is enabled — req.ip already reflects the real client IP
    const ip = req.ip || 'unknown';
    const referrer = req.headers.referer;
    return this.analyticsService.trackView(dto.graphId, ip, referrer, userId);
  }

  @Get('views')
  @UseGuards(JwtAuthGuard)
  getViews(@Query('graphId') graphId: string, @CurrentUser('id') userId: string) {
    return this.analyticsService.getViewsByGraph(graphId, userId);
  }
}
