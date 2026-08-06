import { PrismaClient } from '../../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Checking academic years...");
  const years = await prisma.academicYear.findMany({
    include: { classes: true }
  });

  console.log(`Found ${years.length} academic years.`);
  for (const year of years) {
    const enrollmentCount = await prisma.courseEnrollment.count({
      where: { courseClass: { academicYearId: year.id } }
    });
    console.log(`Year: ${year.year} (${year.id}) - Students: ${enrollmentCount} - Classes: ${year.classes.map(c => c.name).join(", ")}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
