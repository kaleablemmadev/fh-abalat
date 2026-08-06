// src/lib/prisma.ts
import { PrismaClient } from '@/src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Reuse or create the pool
const pool = globalForPrisma.pool ?? new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

// Create client
const prismaClient = new PrismaClient({ adapter });

// If the cached client exists but is missing new models or schema changes, we need to refresh it
if (globalForPrisma.prisma && (!(globalForPrisma.prisma as any).courseEnrollment || !(globalForPrisma.prisma as any).membershipRecommendation)) {
    globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
