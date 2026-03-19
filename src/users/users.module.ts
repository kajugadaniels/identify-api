import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

// PrismaModule is @Global() so no need to import it here
// AuthModule exports PassportModule — also already available globally
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  // Export UsersService so VerificationModule can look up users if needed
  exports: [UsersService],
})
export class UsersModule {}
