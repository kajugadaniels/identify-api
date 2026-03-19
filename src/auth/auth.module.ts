import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // Register Passport with jwt as the default strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Register JWT — reads secret and expiry from .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy, // registered so Passport can find it by the name 'jwt'
  ],
  controllers: [AuthController],
  // Export JwtAuthGuard and PassportModule so other modules can use them
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
