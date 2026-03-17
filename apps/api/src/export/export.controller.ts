import { Controller, Get, Param, Query, Res, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExportService } from './export.service';
import { ExportPngQueryDto } from './dto/export-query.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Export')
@Controller('export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':graphId/json')
  @UseGuards(JwtAuthGuard)
  async exportJson(
    @Param('graphId', ParseUUIDPipe) graphId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const data = await this.exportService.exportJSON(graphId, userId);
    const filename = `${data.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;

    res
      .set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      })
      .send(JSON.stringify(data, null, 2));
  }

  @Get(':graphId/svg')
  @UseGuards(JwtAuthGuard)
  async exportSvg(
    @Param('graphId', ParseUUIDPipe) graphId: string,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const watermark = await this.shouldWatermark(userId);
    const svg = await this.exportService.exportSVG(graphId, userId, watermark);

    res
      .set({
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Content-Disposition': 'attachment; filename="skill-tree.svg"',
      })
      .send(svg);
  }

  @Get(':graphId/png')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async exportPng(
    @Param('graphId', ParseUUIDPipe) graphId: string,
    @CurrentUser('id') userId: string,
    @Query() query: ExportPngQueryDto,
    @Res() res: Response,
  ) {
    const width = query.width ? parseInt(query.width, 10) || 1200 : 1200;
    const watermark = await this.shouldWatermark(userId);
    const png = await this.exportService.exportPNG(graphId, userId, watermark, width);

    res
      .set({
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="skill-tree.png"',
        'Content-Length': String(png.length),
      })
      .send(png);
  }

  @Get('public/:username/:slug.png')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async exportPublicPng(
    @Param('username') username: string,
    @Param('slug') slug: string,
    @Query() query: ExportPngQueryDto,
    @Res() res: Response,
  ) {
    const width = query.width ? parseInt(query.width, 10) || 1200 : 1200;
    const png = await this.exportService.exportPublicPNG(username, slug, width);

    res
      .set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': String(png.length),
        'Access-Control-Allow-Origin': '*',
      })
      .send(png);
  }

  private async shouldWatermark(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    return user?.plan !== 'pro' && user?.plan !== 'enterprise';
  }
}
