import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

// PrismaModule is @Global() — no need to import it here
// ConfigModule is isGlobal: true — same
@Module({
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
