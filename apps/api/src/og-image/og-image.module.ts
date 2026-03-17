import { Module } from '@nestjs/common';
import { OgImageController } from './og-image.controller';
import { OgImageService } from './og-image.service';
import { ScanModule } from '../scan/scan.module';

@Module({
  imports: [ScanModule],
  controllers: [OgImageController],
  providers: [OgImageService],
  exports: [OgImageService],
})
export class OgImageModule {}
