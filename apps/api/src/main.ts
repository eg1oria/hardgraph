import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
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
  const logger = new Logger('Bootstrap');
  const isProd = config.get<string>('NODE_ENV') === 'production';

  // Trust the first reverse proxy (nginx) so req.ip reflects the real client IP
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = config
    .get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
    maxAge: 86400,
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
  logger.log(`HardGraph API running on ${host}:${port} [${isProd ? 'production' : 'development'}]`);

  // Validate GitHub OAuth env vars at startup
  const ghClientId = config.get<string>('GITHUB_CLIENT_ID');
  const ghClientSecret = config.get<string>('GITHUB_CLIENT_SECRET');
  const ghCallbackUrl = config.get<string>('GITHUB_CALLBACK_URL');
  if (!ghClientId || !ghClientSecret) {
    logger.warn('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set — GitHub login will fail.');
  } else {
    logger.log(`GitHub OAuth: clientID=***, callbackURL=${ghCallbackUrl || '(default)'}`);
  }

  const frontendUrl = config.get<string>('NEXT_PUBLIC_APP_URL');
  if (!frontendUrl) {
    logger.warn('NEXT_PUBLIC_APP_URL is not set — OAuth redirects will use http://localhost:3000');
  }
}

bootstrap();
