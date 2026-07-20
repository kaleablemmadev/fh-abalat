// /scripts/updateEventsWithEthiopianDates.ts
import { PrismaClient } from '@prisma/client';
import { dateToEthiopian } from '../src/lib/ethiopiancal';

const prisma = new PrismaClient();

async function updateEventsWithEthiopianDates() {
  try {
    console.log('🔄 Updating events with Ethiopian calendar dates...');
    console.log('⚠️  This will only add new fields, existing data will be preserved.\n');
    
    // Get all events that don't have Ethiopian date fields
    const events = await prisma.event.findMany({
      where: {
        ethiopianYear: null, // Only update events that haven't been converted
      },
    });
    
    console.log(`📋 Found ${events.length} events to update.\n`);
    
    let updated = 0;
    let skipped = 0;
    
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
        
        updated++;
        console.log(`  ✅ Updated event: ${event.title} - ${ethDate.month} ${ethDate.day}, ${ethDate.year}`);
      } catch (error) {
        skipped++;
        console.log(`  ⚠️  Failed to update event ${event.id}:`, error);
      }
    }
    
    console.log(`\n✅ Update complete!`);
    console.log(`  ✅ Updated: ${updated} events`);
    console.log(`  ⏭️  Skipped: ${skipped} events`);
    console.log(`  ℹ️  Already had Ethiopian dates: ${events.length - updated - skipped} events`);
    
  } catch (error) {
    console.error('❌ Error updating events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
updateEventsWithEthiopianDates();