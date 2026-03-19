import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // ── Environment config ──────────────────────────
    // Makes ConfigService available everywhere
    // isGlobal: true means we don't re-import ConfigModule in every module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Rate limiting ───────────────────────────────
    // Limits each IP to THROTTLE_LIMIT requests per THROTTLE_TTL seconds
    // Prevents brute force attacks on auth and verify endpoints
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60),
          limit: config.get<number>('THROTTLE_LIMIT', 10),
        },
      ],
    }),

    // ── Database ────────────────────────────────────
    // Connects to Neon PostgreSQL using DATABASE_URL from .env
    // SSL is required for Neon connections
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false }, // required for Neon
        autoLoadEntities: true, // auto-picks up all @Entity() classes
        synchronize: process.env.NODE_ENV !== 'production', // never true in prod
      }),
    }),
  ],
})
export class AppModule {}
