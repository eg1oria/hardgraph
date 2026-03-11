import { Module } from '@nestjs/common';
import { OgImageController } from './og-image.controller';
import { OgImageService } from './og-image.service';

@Module({
  controllers: [OgImageController],
  providers: [OgImageService],
})
export class OgImageModule {}
