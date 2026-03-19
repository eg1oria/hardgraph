import { Module } from '@nestjs/common';
import { VacancyApplicationsController } from './vacancy-applications.controller';
import { VacancyApplicationsService } from './vacancy-applications.service';

@Module({
  controllers: [VacancyApplicationsController],
  providers: [VacancyApplicationsService],
})
export class VacancyApplicationsModule {}
