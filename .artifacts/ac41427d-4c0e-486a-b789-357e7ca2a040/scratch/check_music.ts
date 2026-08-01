import 'dotenv/config';
import { PrismaClient } from "../../../src/generated/prisma/index.js";
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const music = await prisma.musicFile.findMany();
  console.log('Music Files in DB:', JSON.stringify(music, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
