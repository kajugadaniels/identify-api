import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Register ───────────────────────────────────────
  async register(dto: RegisterDto) {
    // Check if email is already taken — before doing any hashing work
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      // Use a vague message so we don't reveal which emails are registered
      throw new ConflictException('An account with this email already exists');
    }

    // Hash the password — bcrypt with 12 salt rounds
    // 12 is a good balance: strong enough, not too slow for UX
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create the user — store email in lowercase always
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      // Return only safe fields — never the password hash
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Issue a token immediately so the user is logged in after registering
    const token = this.generateToken({ sub: user.id, email: user.email });

    return { user, token };
  }

  // ── Login ──────────────────────────────────────────
  async login(dto: LoginDto) {
    // Find user by email — always lowercase comparison
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Use a generic message — never reveal "email not found" vs "wrong password"
    // Both cases look the same to the caller to prevent user enumeration attacks
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare the submitted password against the stored hash
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Strip password from the returned user object
    const { password: _password, ...safeUser } = user;

    const token = this.generateToken({ sub: user.id, email: user.email });

    return { user: safeUser, token };
  }

  // ── Private: generate JWT ──────────────────────────
  private generateToken(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '7d'),
    });
  }
}
