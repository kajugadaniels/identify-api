import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { createValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = parseInt(process.env.PORT ?? '3001', 10);

  // ── Security headers ─────────────────────────────
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────
  // Reads frontend URL from .env — never hardcoded
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // ── Global prefix ─────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Global pipes, filters, interceptors ───────────
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(port);
  console.log(`Gateway running on: http://localhost:${port}/api/v1`);
}

void bootstrap();
