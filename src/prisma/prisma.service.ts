import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 requires a driver adapter — datasourceUrl is no longer accepted.
// Passing a PoolConfig lets PrismaPg manage the pg.Pool internally, which
// avoids @types/pg version conflicts between the top-level install and the
// version bundled inside @prisma/adapter-pg.
// DATABASE_URL (pooled Neon URL) is used at runtime; DIRECT_URL is CLI-only.
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    this.prisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'warn', 'error']
          : ['error'],
    });
  }

  // ── Model delegates ───────────────────────────────────────────────────────
  // Expose model accessors so callers use prismaService.user.findMany() etc.

  get user() {
    return this.prisma.user;
  }

  get verification() {
    return this.prisma.verification;
  }

  // ── Client utilities ──────────────────────────────────────────────────────

  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }

  get $queryRaw() {
    return this.prisma.$queryRaw.bind(this.prisma);
  }

  get $executeRaw() {
    return this.prisma.$executeRaw.bind(this.prisma);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    await this.prisma.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
    this.logger.log('Database disconnected');
  }
}
