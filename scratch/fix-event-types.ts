// C:/Dev/fh-abalat/scratch/fix-event-types.ts
import { PrismaClient } from '../src/generated/prisma/client/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Fixing event types for system attendances...');

  try {
    const choreEvents = await prisma.event.updateMany({
      where: {
        title: { contains: 'Chore' },
        eventType: 'EVENT'
      },
      data: {
        eventType: 'CHORE'
      }
    });
    console.log(`✅ Updated ${choreEvents.count} Chore events.`);

    const sundayEvents = await prisma.event.updateMany({
      where: {
        title: { contains: 'Sunday' },
        eventType: 'EVENT'
      },
      data: {
        eventType: 'SUNDAY'
      }
    });
    console.log(`✅ Updated ${sundayEvents.count} Sunday events.`);
  } catch (error) {
    console.error('Error during update:', error);
  }

  console.log('🏁 Done.');
}

main()
  .catch((e) => {
    console.error('❌ Failed to fix event types:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
