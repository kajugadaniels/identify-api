import { defineConfig } from "prisma/config";

// Prisma 7: connection URLs live here, not in schema.prisma.
//
// DIRECT_DATABASE_URL → non-pooled Neon connection string (Prisma CLI only).
//                       migrate dev / db push run DDL — Neon's pooler blocks that.
// DATABASE_URL        → pooled Neon URL used at runtime by PrismaService via
//                       the @prisma/adapter-pg driver adapter.
//
// The Prisma CLI loads .env automatically — no dotenv import needed.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_DATABASE_URL"],
  },
});
