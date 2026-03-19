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
import { VacancyApplicationsService } from './vacancy-applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';

@ApiTags('Vacancy Applications')
@Controller()
export class VacancyApplicationsController {
  constructor(private readonly appService: VacancyApplicationsService) {}

  /** Candidate applies to a vacancy */
  @Post('vacancies/:vacancyId/applications')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  apply(
    @Param('vacancyId', ParseUUIDPipe) vacancyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.appService.apply(vacancyId, userId, dto);
  }

  /** HR views applications for their vacancy */
  @Get('vacancies/:vacancyId/applications')
  @UseGuards(JwtAuthGuard)
  findByVacancy(
    @Param('vacancyId', ParseUUIDPipe) vacancyId: string,
    @CurrentUser('id') userId: string,
    @Query() query: QueryApplicationsDto,
  ) {
    return this.appService.findByVacancy(vacancyId, userId, query);
  }

  /** HR updates application status */
  @Patch('vacancies/:vacancyId/applications/:applicationId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60_000, limit: 10 } })
  updateStatus(
    @Param('vacancyId', ParseUUIDPipe) vacancyId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.appService.updateStatus(vacancyId, applicationId, userId, dto);
  }

  /** Candidate withdraws their pending application */
  @Delete('vacancies/:vacancyId/applications/:applicationId')
  @UseGuards(JwtAuthGuard)
  withdraw(
    @Param('vacancyId', ParseUUIDPipe) vacancyId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appService.withdraw(vacancyId, applicationId, userId);
  }

  /** HR analytics for a specific vacancy */
  @Get('vacancies/:vacancyId/analytics')
  @UseGuards(JwtAuthGuard)
  getVacancyAnalytics(
    @Param('vacancyId', ParseUUIDPipe) vacancyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appService.getVacancyAnalytics(vacancyId, userId);
  }

  /** Candidate views their own applications */
  @Get('applications/mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser('id') userId: string) {
    return this.appService.findMine(userId);
  }

  /** HR overview analytics across all vacancies */
  @Get('applications/analytics/overview')
  @UseGuards(JwtAuthGuard)
  getOverviewAnalytics(@CurrentUser('id') userId: string) {
    return this.appService.getOverviewAnalytics(userId);
  }

  /** Check if current user has applied to a vacancy */
  @Get('vacancies/:vacancyId/applications/check')
  @UseGuards(JwtAuthGuard)
  checkApplication(
    @Param('vacancyId', ParseUUIDPipe) vacancyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.appService.hasApplied(vacancyId, userId);
  }
}
