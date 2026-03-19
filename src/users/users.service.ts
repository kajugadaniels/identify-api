import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

// Safe user type — the shape we return to the client
// Password is always excluded at the type level so we can't accidentally leak it
export type SafeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
};

// Reusable Prisma select object — defines exactly which fields
// come back from the DB. Defined once here, used in every query
// so we never accidentally forget to exclude password somewhere
const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
  updatedAt: true,
  password: false, // explicitly false — never returned
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Get profile ────────────────────────────────────
  // Used by GET /users/profile
  // Takes the userId from the JWT — not from the URL (prevents IDOR attacks)
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });

    // This shouldn't happen if JWT is valid, but we guard it anyway
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ── Update profile ─────────────────────────────────
  // Used by PATCH /users/profile
  // Only updates fields that were actually sent in the request body
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<SafeUser> {
    // Verify user still exists before attempting update
    const exists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('User not found');
    }

    // Prisma only updates fields present in dto
    // If firstName is not sent, it stays unchanged in the DB
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        // Spread only the fields that were provided
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
      },
      select: SAFE_USER_SELECT,
    });

    return updated;
  }

  // ── Get verification history ───────────────────────
  // Used by GET /users/verifications
  // Returns past verification attempts for the logged-in user
  async getVerificationHistory(userId: string) {
    const verifications = await this.prisma.verification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // newest first
      select: {
        id: true,
        livenessScore: true,
        faceMatchScore: true,
        ocrPassed: true,
        compositeScore: true,
        passed: true,
        createdAt: true,
        // Don't join the full user object — we already know who they are
      },
    });

    return verifications;
  }
}
