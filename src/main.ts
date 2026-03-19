import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Pull config service to read .env values
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  // ── Security headers via Helmet ──────────────────
  // Sets X-Content-Type-Options, X-Frame-Options, etc.
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────
  // Only allow requests from the Next.js frontend
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // ── Global prefix ─────────────────────────────────
  // All routes will be prefixed with /api/v1
  app.setGlobalPrefix('api/v1');

  // ── Global validation pipe ────────────────────────
  // Automatically validates and transforms request bodies
  // using class-validator decorators on DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields from body
      forbidNonWhitelisted: true, // throws error if unknown fields sent
      transform: true, // auto-converts types (string → number etc.)
    }),
  );

  // ── Global exception filter ───────────────────────
  // Catches all errors and returns a clean, consistent response
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global logging interceptor ────────────────────
  // Logs every incoming request and its response time
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(port);
  console.log(`Gateway running on http://localhost:${port}/api/v1`);
}

void bootstrap();
