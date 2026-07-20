// /scripts/updateUsersWithEthiopianDates.ts
import { PrismaClient } from '@prisma/client';
import { dateToEthiopian, formatEthiopianDate } from '../src/lib/ethiopiancal';

const prisma = new PrismaClient();

async function updateUsersWithEthiopianDates() {
  try {
    console.log('🔄 Updating users with Ethiopian register dates...');
    console.log('⚠️  This will only add new fields, existing data will be preserved.\n');
    
    const users = await prisma.user.findMany({
      where: {
        registerDate: null, // Only update users without register date
      },
    });
    
    console.log(`📋 Found ${users.length} users to update.\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const user of users) {
      try {
        const ethDate = dateToEthiopian(user.createdAt);
        const formattedDate = formatEthiopianDate(ethDate);
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            registerDate: formattedDate,
          },
        });
        
        updated++;
        console.log(`  ✅ Updated user: ${user.fullName || user.id} - ${formattedDate}`);
      } catch (error) {
        skipped++;
        console.log(`  ⚠️  Failed to update user ${user.id}:`, error);
      }
    }
    
    console.log(`\n✅ Update complete!`);
    console.log(`  ✅ Updated: ${updated} users`);
    console.log(`  ⏭️  Skipped: ${skipped} users`);
    console.log(`  ℹ️  Already had register date: ${users.length - updated - skipped} users`);
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsersWithEthiopianDates();