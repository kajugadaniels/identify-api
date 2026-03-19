// src/prisma/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Log slow queries and errors in development
      // In production keep only 'error' to reduce noise
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'warn', 'error']
          : ['error'],
    });
  }

  // Connect to DB when the NestJS module initializes
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  // Disconnect cleanly when the app shuts down
  // Prevents connection leaks during hot-reload in development
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
