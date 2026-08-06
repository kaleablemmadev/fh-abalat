import { PrismaClient } from '../../../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Inspecting Prisma User model fields...");

  try {
    const user = await prisma.user.findFirst();
    if (user) {
      console.log("Actual user record keys:", Object.keys(user));
    } else {
      console.log("No user records found.");
    }
  } catch (e) {
    console.error("Error fetching user:", e);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
