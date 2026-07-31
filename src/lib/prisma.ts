// src/lib/prisma.ts
import { PrismaClient } from '@/src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Force client refresh to pick up new models (like Playlist)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Create client
const prismaClient = new PrismaClient({ adapter });

// If the cached client exists but is missing new models (like playlist), we need to refresh it
if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).playlist) {
    globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;