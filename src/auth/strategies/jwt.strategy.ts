import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

// The shape of data we store inside the JWT payload
export interface JwtPayload {
  sub: string; // user's UUID — "sub" is the JWT standard field for subject
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Extract the token from the Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens — never allow expired JWTs through
      ignoreExpiration: false,

      // Read secret from .env — never hardcode this
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  // This runs automatically after the token signature is verified
  // Whatever we return here gets attached to request.user
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      // Never return the password hash — even to internal code
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // If user was deleted after token was issued — reject the request
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return user;
  }
}
