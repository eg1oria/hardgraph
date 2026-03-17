import { Module } from '@nestjs/common';
import { GraphsController } from './graphs.controller';
import { GraphsService } from './graphs.service';
import { ScanModule } from '../scan/scan.module';

@Module({
  imports: [ScanModule],
  controllers: [GraphsController],
  providers: [GraphsService],
  exports: [GraphsService],
})
export class GraphsModule {}
