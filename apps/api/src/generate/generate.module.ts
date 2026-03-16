import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { GithubModule } from '../github/github.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [GithubModule, PrismaModule],
  controllers: [GenerateController],
  providers: [GenerateService],
})
export class GenerateModule {}
