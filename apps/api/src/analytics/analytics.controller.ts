import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  track(@Body() body: { graphId: string }, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const referrer = req.headers.referer;
    return this.analyticsService.trackView(body.graphId, ip, referrer);
  }

  @Get('views')
  @UseGuards(JwtAuthGuard)
  getViews(@Query('graphId') graphId: string, @CurrentUser('id') userId: string) {
    return this.analyticsService.getViewsByGraph(graphId, userId);
  }
}
