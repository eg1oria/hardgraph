import { Controller, Get, Param, Res, Logger, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GraphsService } from '../graphs/graphs.service';
import { EmbedService } from './embed.service';

@ApiTags('Embed')
@Controller('embed')
export class EmbedController {
  private readonly logger = new Logger(EmbedController.name);

  constructor(
    private readonly graphsService: GraphsService,
    private readonly embedService: EmbedService,
  ) {}

  /**
   * Returns an SVG skill card for a public graph.
   * CDN-friendly: cached for 1 hour, stale-while-revalidate for 1 day.
   * Uses @Res() to bypass TransformInterceptor and return raw SVG.
   */
  @Get(':username/:slug.svg')
  async getSvg(
    @Param('username') username: string,
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    try {
      const graph = await this.graphsService.findPublic(username, slug);

      const svg = this.embedService.generateSvg({
        title: graph.title,
        user: {
          username: graph.user.username,
          displayName: graph.user.displayName,
        },
        nodes: graph.nodes.map((n) => ({
          name: n.name,
          level: n.level,
          category: n.category,
        })),
      });

      res
        .set({
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          'Access-Control-Allow-Origin': '*',
        })
        .send(svg);
    } catch (error) {
      if (error instanceof NotFoundException) {
        const svg = this.embedService.generateErrorSvg('Graph not found or is private');
        res
          .status(404)
          .set({
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
            'Access-Control-Allow-Origin': '*',
          })
          .send(svg);
        return;
      }

      this.logger.warn(`Embed SVG error for ${username}/${slug}: ${error}`);
      const svg = this.embedService.generateErrorSvg('Something went wrong');
      res
        .status(500)
        .set({
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'no-cache',
        })
        .send(svg);
    }
  }
}
