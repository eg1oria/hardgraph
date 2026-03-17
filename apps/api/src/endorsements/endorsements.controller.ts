import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { EndorsementsService } from './endorsements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateEndorsementDto } from './dto/create-endorsement.dto';

@ApiTags('Endorsements')
@Controller('endorsements')
export class EndorsementsController {
  constructor(private readonly endorsementsService: EndorsementsService) {}

  @Post()
  @Throttle({ short: { ttl: 60_000, limit: 15 } })
  @UseGuards(OptionalAuthGuard)
  create(
    @Body() dto: CreateEndorsementDto,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    const ip = req.ip || 'unknown';
    return this.endorsementsService.create(dto.nodeId, dto.graphId, ip, userId);
  }

  @Get('graph/:graphId')
  getCounts(@Param('graphId', ParseUUIDPipe) graphId: string) {
    return this.endorsementsService.getCountsByGraph(graphId);
  }

  @Get('graph/:graphId/mine')
  @UseGuards(OptionalAuthGuard)
  getMyEndorsements(
    @Param('graphId', ParseUUIDPipe) graphId: string,
    @Req() req: Request,
    @CurrentUser('id') userId?: string,
  ) {
    const ip = req.ip || 'unknown';
    return this.endorsementsService.getUserEndorsements(graphId, userId, ip);
  }

  @Delete(':nodeId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  remove(@Param('nodeId', ParseUUIDPipe) nodeId: string, @CurrentUser('id') userId: string) {
    return this.endorsementsService.remove(nodeId, userId);
  }
}
