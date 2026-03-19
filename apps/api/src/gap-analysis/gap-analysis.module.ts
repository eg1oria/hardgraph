import { Module } from '@nestjs/common';
import { GapAnalysisController } from './gap-analysis.controller';
import { GapAnalysisService } from './gap-analysis.service';

@Module({
  controllers: [GapAnalysisController],
  providers: [GapAnalysisService],
})
export class GapAnalysisModule {}
