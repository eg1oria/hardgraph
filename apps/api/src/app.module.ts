import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GraphsModule } from './graphs/graphs.module';
import { NodesModule } from './nodes/nodes.module';
import { EdgesModule } from './edges/edges.module';
import { CategoriesModule } from './categories/categories.module';
import { TemplatesModule } from './templates/templates.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GithubModule } from './github/github.module';
import { EndorsementsModule } from './endorsements/endorsements.module';

import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { EmbedModule } from './embed/embed.module';
import { ExportModule } from './export/export.module';
import { OgImageModule } from './og-image/og-image.module';
import { ResumeModule } from './resume/resume.module';
import { ScanModule } from './scan/scan.module';
import { StoriesModule } from './stories/stories.module';
import { GapAnalysisModule } from './gap-analysis/gap-analysis.module';
import { HealthController } from './health.controller';

import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env', // apps/api/.env (if exists)
        join('..', '..', '.env'), // root .env (when CWD = apps/api)
      ],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60_000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 600_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    GraphsModule,
    NodesModule,
    EdgesModule,
    CategoriesModule,
    TemplatesModule,
    AnalyticsModule,
    GithubModule,
    EndorsementsModule,
    AdminModule,
    EmbedModule,
    ExportModule,
    OgImageModule,
    ResumeModule,
    ScanModule,
    StoriesModule,
    GapAnalysisModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
