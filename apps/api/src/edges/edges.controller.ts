import { Controller, Post, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EdgesService } from './edges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateEdgeDto } from './dto/create-edge.dto';

@ApiTags('Edges')
@Controller()
@UseGuards(JwtAuthGuard)
export class EdgesController {
  constructor(private readonly edgesService: EdgesService) {}

  @Post('graphs/:graphId/edges')
  create(
    @Param('graphId', ParseUUIDPipe) graphId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEdgeDto,
  ) {
    return this.edgesService.create(graphId, userId, dto);
  }

  @Delete('edges/:id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.edgesService.remove(id, userId);
  }
}
