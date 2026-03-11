import { Controller, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NodesService } from './nodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';

@ApiTags('Nodes')
@Controller()
@UseGuards(JwtAuthGuard)
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Post('graphs/:graphId/nodes')
  create(
    @Param('graphId') graphId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateNodeDto,
  ) {
    return this.nodesService.create(graphId, userId, dto);
  }

  @Put('nodes/batch')
  batchUpdate(
    @CurrentUser('id') userId: string,
    @Body('nodes') nodes: { id: string; positionX: number; positionY: number }[],
  ) {
    return this.nodesService.batchUpdate(userId, nodes);
  }

  @Put('nodes/:id')
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateNodeDto) {
    return this.nodesService.update(id, userId, dto);
  }

  @Delete('nodes/:id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.nodesService.remove(id, userId);
  }
}
