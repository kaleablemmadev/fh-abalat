import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { dateToEthiopian } from '../lib/ethiopiancal';
import { generateAccessCode, generateCourseStudentCode } from '../lib/utils';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 20000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting migration...");
  const users = await prisma.user.findMany();

  for (const user of users) {
    const ethDate = dateToEthiopian(user.createdAt);
    const yearDigits = ethDate.year.toString().slice(-2);

    const memberTypes: any[] = [];
    let newPrivateId = user.privateId;
    let newCoursePrivateId = user.coursePrivateId;

    // Detect type and generate new IDs
    if (user.privateId?.startsWith('FH-') && !user.privateId?.startsWith('FHC-')) {
      memberTypes.push('REGULAR_MEMBER');
      newPrivateId = generateAccessCode(yearDigits);
    } else if (user.privateId?.startsWith('FHC-')) {
      memberTypes.push('COURSE_STUDENT');
      newCoursePrivateId = generateCourseStudentCode(yearDigits);
      newPrivateId = null; // Move FHC to coursePrivateId
    } else if (!user.privateId) {
       // If no ID, but user exists, check if they were regular members by default
       memberTypes.push('REGULAR_MEMBER');
       newPrivateId = generateAccessCode(yearDigits);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        roles: { set: memberTypes },
        privateId: newPrivateId,
        coursePrivateId: newCoursePrivateId
      }
    });
  }

  console.log("Migration complete.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
