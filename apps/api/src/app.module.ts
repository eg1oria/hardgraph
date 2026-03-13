import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
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
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
