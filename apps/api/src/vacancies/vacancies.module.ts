import { Module } from '@nestjs/common';
import { VacanciesController } from './vacancies.controller';
import { VacanciesService } from './vacancies.service';

@Module({
  controllers: [VacanciesController],
  providers: [VacanciesService],
})
export class VacanciesModule {}
