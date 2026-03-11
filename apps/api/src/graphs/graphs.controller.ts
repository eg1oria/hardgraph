import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GraphsService } from './graphs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateGraphDto } from './dto/create-graph.dto';
import { UpdateGraphDto } from './dto/update-graph.dto';

@ApiTags('Graphs')
@Controller()
export class GraphsController {
  constructor(private readonly graphsService: GraphsService) {}

  @Get('graphs')
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser('id') userId: string) {
    return this.graphsService.findAllByUser(userId);
  }

  @Get('graphs/explore')
  explore() {
    return this.graphsService.findRecentPublic();
  }

  @Post('graphs')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGraphDto) {
    return this.graphsService.create(userId, dto);
  }

  @Get('graphs/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.graphsService.findById(id, userId);
  }

  @Put('graphs/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateGraphDto) {
    return this.graphsService.update(id, userId, dto);
  }

  @Delete('graphs/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.graphsService.remove(id, userId);
  }

  @Get('public/:username/:slug')
  findPublic(@Param('username') username: string, @Param('slug') slug: string) {
    return this.graphsService.findPublic(username, slug);
  }
}
