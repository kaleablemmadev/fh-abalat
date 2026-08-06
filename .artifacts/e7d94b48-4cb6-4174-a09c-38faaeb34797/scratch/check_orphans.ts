import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orphanClasses = await prisma.courseClass.findMany({
    where: { academicYearId: null }
  });
  console.log(`Found ${orphanClasses.length} orphan classes:`, orphanClasses.map(c => `${c.name} (${c.year})`));

  const orphanCourseYears = await prisma.courseYear.findMany({
    where: {
      courseClass: {
        academicYearId: null
      }
    }
  });
  console.log(`Found ${orphanCourseYears.length} orphan course years.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
