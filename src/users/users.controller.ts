import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { SafeUser } from './users.service';

// Every route in this controller requires a valid JWT
// JwtAuthGuard runs JwtStrategy.validate() before the handler executes
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/v1/users/profile
  // Returns the logged-in user's profile
  // userId comes from the JWT — never from a URL param (prevents IDOR)
  @Get('profile')
  async getProfile(@CurrentUser() user: SafeUser) {
    const profile = await this.usersService.getProfile(user.id);
    return {
      success: true,
      data: profile,
    };
  }

  // PATCH /api/v1/users/profile
  // Updates firstName and/or lastName — email is not changeable here
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: updated,
    };
  }

  // GET /api/v1/users/verifications
  // Returns the logged-in user's past verification attempts
  @Get('verifications')
  async getVerificationHistory(@CurrentUser() user: SafeUser) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const history = await this.usersService.getVerificationHistory(user.id);
    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: history,
    };
  }
}
