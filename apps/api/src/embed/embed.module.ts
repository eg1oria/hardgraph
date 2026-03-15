import { Module } from '@nestjs/common';
import { GraphsModule } from '../graphs/graphs.module';
import { EmbedController } from './embed.controller';
import { EmbedService } from './embed.service';

@Module({
  imports: [GraphsModule],
  controllers: [EmbedController],
  providers: [EmbedService],
})
export class EmbedModule {}
