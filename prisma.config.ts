import { defineConfig } from "prisma/config";

// Prisma 7: connection URLs live here, not in schema.prisma.
//
// DIRECT_URL   → non-pooled Neon connection string (required by the Prisma CLI).
//                `migrate dev` and `db push` run DDL statements and need a direct
//                connection — Neon's pooler does not support those operations.
// DATABASE_URL → pooled Neon connection string — used only by PrismaService at
//                runtime (passed via `datasourceUrl` in the constructor).
//
// The Prisma CLI automatically loads your .env file, so no dotenv import needed.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
