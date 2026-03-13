import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const isProd = config.get<string>('NODE_ENV') === 'production';

  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = config
    .get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.setGlobalPrefix('api', { exclude: ['health'] });

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HardGraph API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get<number>('API_PORT', 4000);
  const host = config.get<string>('API_HOST', 'localhost');

  app.enableShutdownHooks();

  await app.listen(port, host);
  console.log(
    `HardGraph API running on ${host}:${port} [${isProd ? 'production' : 'development'}]`,
  );

  // Validate GitHub OAuth env vars at startup
  const ghClientId = config.get<string>('GITHUB_CLIENT_ID');
  const ghClientSecret = config.get<string>('GITHUB_CLIENT_SECRET');
  const ghCallbackUrl = config.get<string>('GITHUB_CALLBACK_URL');
  if (!ghClientId || !ghClientSecret) {
    console.warn(
      '[OAuth] WARNING: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set — GitHub login will fail.',
    );
  } else {
    console.log(
      `[OAuth] GitHub OAuth: clientID=${ghClientId.slice(0, 4)}..., callbackURL=${ghCallbackUrl || '(default)'}`,
    );
  }

  const frontendUrl = config.get<string>('NEXT_PUBLIC_APP_URL');
  if (!frontendUrl) {
    console.warn(
      '[OAuth] WARNING: NEXT_PUBLIC_APP_URL is not set — OAuth redirects will use http://localhost:3000',
    );
  }
}

bootstrap();
