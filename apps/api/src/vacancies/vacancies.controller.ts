import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { VacanciesService } from './vacancies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import { VacancyQueryDto } from './dto/vacancy-query.dto';

@ApiTags('Vacancies')
@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVacancyDto) {
    return this.vacanciesService.create(userId, dto);
  }

  @Get()
  @Throttle({ short: { ttl: 60_000, limit: 30 } })
  findAll(@Query() query: VacancyQueryDto) {
    return this.vacanciesService.findAll(query.field, query.search);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser('id') userId: string) {
    return this.vacanciesService.findMine(userId);
  }

  @Get(':id')
  @Throttle({ short: { ttl: 60_000, limit: 30 } })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vacanciesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateVacancyDto,
  ) {
    return this.vacanciesService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.vacanciesService.remove(id, userId);
  }

  @Get(':vacancyId/compare/:graphId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60_000, limit: 20 } })
  compare(
    @Param('vacancyId', ParseUUIDPipe) vacancyId: string,
    @Param('graphId', ParseUUIDPipe) graphId: string,
  ) {
    return this.vacanciesService.compareWithGraph(vacancyId, graphId);
  }
}
