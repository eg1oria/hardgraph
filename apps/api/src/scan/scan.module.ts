import { Module } from '@nestjs/common';
import { GithubModule } from '../github/github.module';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';

@Module({
  imports: [GithubModule],
  controllers: [ScanController],
  providers: [ScanService],
  exports: [ScanService],
})
export class ScanModule {}
