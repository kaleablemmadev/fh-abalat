// scripts/updateEthiopianDates.ts
import { prisma } from '../src/lib/prisma';
import { dateToEthiopian, formatEthiopianDate } from '../src/lib/ethiopiancal';

async function updateEthiopianDates() {
  console.log('🔄 Updating Ethiopian dates...');
  
  try {
    // Update Events with Ethiopian dates
    console.log('📅 Updating events...');
    const events = await prisma.event.findMany({
      where: {
        ethiopianYear: null,
      },
    });

    console.log(`  Found ${events.length} events to update`);

    let updatedEvents = 0;
    for (const event of events) {
      try {
        const ethDate = dateToEthiopian(event.date);
        
        // Find month number from name
        let monthNumber = 1;
        for (const [key, value] of Object.entries(ethDate.month)) {
          if (value === ethDate.month) {
            monthNumber = parseInt(key);
            break;
          }
        }

        await prisma.event.update({
          where: { id: event.id },
          data: {
            ethiopianYear: ethDate.year,
            ethiopianMonth: monthNumber,
            ethiopianDay: ethDate.day,
          },
        });
        updatedEvents++;
        if (updatedEvents % 10 === 0) {
          console.log(`  ✅ Updated ${updatedEvents} events...`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to update event ${event.id}:`, error);
      }
    }
    console.log(`  ✅ Updated ${updatedEvents} events`);

    // Update Users with Ethiopian dates
    console.log('\n👤 Updating users...');
    const users = await prisma.user.findMany({
      where: {
        ethiopianCreatedAt: null,
      },
    });

    console.log(`  Found ${users.length} users to update`);

    let updatedUsers = 0;
    for (const user of users) {
      try {
        const ethDate = dateToEthiopian(user.createdAt);
        const formattedDate = formatEthiopianDate(ethDate);
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ethiopianCreatedAt: formattedDate,
          },
        });
        updatedUsers++;
      } catch (error) {
        console.error(`  ❌ Failed to update user ${user.id}:`, error);
      }
    }
    console.log(`  ✅ Updated ${updatedUsers} users`);

    console.log('\n✅ Update complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  updateEthiopianDates().catch(console.error);
}

export { updateEthiopianDates };