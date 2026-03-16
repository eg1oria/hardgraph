import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  @UseGuards(OptionalAuthGuard)
  track(@Body() dto: TrackViewDto, @Req() req: Request, @CurrentUser('id') userId?: string) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    const referrer = req.headers.referer;
    return this.analyticsService.trackView(dto.graphId, ip, referrer, userId);
  }

  @Get('views')
  @UseGuards(JwtAuthGuard)
  getViews(@Query('graphId') graphId: string, @CurrentUser('id') userId: string) {
    return this.analyticsService.getViewsByGraph(graphId, userId);
  }
}
