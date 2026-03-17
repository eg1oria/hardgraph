import { Controller, Get, Param, Req, Res, Logger, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { OgImageService } from './og-image.service';
import { ScanService } from '../scan/scan.service';

@ApiTags('OG Image')
@Controller('og-image')
export class OgImageController {
  private readonly logger = new Logger(OgImageController.name);

  constructor(
    private readonly ogImageService: OgImageService,
    private readonly prisma: PrismaService,
    private readonly scanService: ScanService,
  ) {}

  @Get('scan/:username')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async getScanOgImage(
    @Param('username') username: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const result = await this.scanService.scanUsername(username);

      const png = this.ogImageService.generateScanOgImage(result);

      res
        .set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Content-Length': String(png.length),
          'Access-Control-Allow-Origin': '*',
        })
        .send(png);
    } catch (error) {
      this.logger.warn(`Scan OG image error for ${username}: ${error}`);
      const defaultPng = this.ogImageService.generateDefaultOgImage();
      res
        .status(500)
        .set({
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
        })
        .send(defaultPng);
    }
  }

  @Get(':username/:slug.png')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async getOgImage(
    @Param('username') username: string,
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const graph = await this.prisma.graph.findFirst({
        where: { slug, isPublic: true, user: { username } },
        select: {
          id: true,
          title: true,
          description: true,
          endorsementCount: true,
          updatedAt: true,
          user: { select: { username: true, displayName: true } },
          nodes: {
            select: {
              name: true,
              level: true,
              category: { select: { color: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!graph) {
        const defaultPng = this.ogImageService.generateDefaultOgImage();
        res
          .status(404)
          .set({
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=300',
          })
          .send(defaultPng);
        return;
      }

      const etag = `"og-${graph.id}-${graph.updatedAt.getTime()}"`;
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }

      const png = this.ogImageService.generateOgImage({
        title: graph.title,
        description: graph.description,
        username: graph.user.username,
        displayName: graph.user.displayName,
        nodeCount: graph.nodes.length,
        endorsementCount: graph.endorsementCount,
        skills: graph.nodes.map((n) => ({
          name: n.name,
          level: n.level,
          categoryColor: n.category?.color ?? null,
        })),
      });

      res
        .set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'Content-Length': String(png.length),
          'Access-Control-Allow-Origin': '*',
          ETag: etag,
        })
        .send(png);
    } catch (error) {
      this.logger.warn(`OG image error for ${username}/${slug}: ${error}`);
      const defaultPng = this.ogImageService.generateDefaultOgImage();
      res
        .status(500)
        .set({
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache',
        })
        .send(defaultPng);
    }
  }
}
