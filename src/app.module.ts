import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // ── Environment config ───────────────────────────
    // isGlobal: true means ConfigService is available in every module
    // without needing to re-import ConfigModule each time
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Rate limiting ────────────────────────────────
    // Reads limits from .env — no hardcoded values in code
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60),
          limit: config.get<number>('THROTTLE_LIMIT', 10),
        },
      ],
    }),

    // Auth and Users modules will be imported here in the next steps
  ],
})
export class AppModule {}
