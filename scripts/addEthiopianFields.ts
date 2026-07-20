// /scripts/addEthiopianFields.ts
import { prisma } from '../src/lib/prisma';

async function addEthiopianFields() {
  console.log('🔄 Adding Ethiopian calendar fields...');
  console.log('⚠️  This will not delete any data.\n');

  try {
    // Check if the migration already exists in the migrations table
    const migrationExists = await prisma.$queryRaw`
      SELECT 1 FROM "_prisma_migrations" 
      WHERE migration_name = 'add_ethiopian_calendar_fields'
      LIMIT 1
    `;

    if ((migrationExists as Array<unknown>).length > 0) {
      console.log('✅ Migration already applied!');
      return;
    }

    console.log('📝 Adding columns to Event table...');
    
    // Add columns to Event table if they don't exist
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
        -- Add columns to Event table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='Event' AND column_name='ethiopianYear') THEN
          ALTER TABLE "Event" ADD COLUMN "ethiopianYear" INTEGER;
          RAISE NOTICE 'Added ethiopianYear column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='Event' AND column_name='ethiopianMonth') THEN
          ALTER TABLE "Event" ADD COLUMN "ethiopianMonth" INTEGER;
          RAISE NOTICE 'Added ethiopianMonth column';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='Event' AND column_name='ethiopianDay') THEN
          ALTER TABLE "Event" ADD COLUMN "ethiopianDay" INTEGER;
          RAISE NOTICE 'Added ethiopianDay column';
        END IF;
        
        -- Add column to User table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name='User' AND column_name='ethiopianCreatedAt') THEN
          ALTER TABLE "User" ADD COLUMN "ethiopianCreatedAt" TEXT;
          RAISE NOTICE 'Added ethiopianCreatedAt column';
        END IF;
        
        -- Add indexes
        IF NOT EXISTS (SELECT 1 FROM pg_indexes 
          WHERE tablename='Event' AND indexname='Event_ethiopianYear_ethiopianMonth_idx') THEN
          CREATE INDEX "Event_ethiopianYear_ethiopianMonth_idx" 
          ON "Event" ("ethiopianYear", "ethiopianMonth");
          RAISE NOTICE 'Added index on ethiopianYear, ethiopianMonth';
        END IF;
        
        RAISE NOTICE '✅ All columns and indexes added successfully';
      END $$;
    `;

    console.log('✅ Columns added successfully!');

    // Mark the migration as applied
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (
        id, 
        checksum, 
        finished_at, 
        migration_name, 
        logs, 
        rolled_back_at, 
        started_at, 
        applied_steps_count
      ) VALUES (
        gen_random_uuid()::text,
        md5('add_ethiopian_calendar_fields'),
        NOW(),
        'add_ethiopian_calendar_fields',
        'Migration applied via script',
        NULL,
        NOW(),
        1
      ) ON CONFLICT (migration_name) DO NOTHING;
    `;

    console.log('✅ Migration marked as applied in Prisma migrations table');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  addEthiopianFields().catch(console.error);
}

export { addEthiopianFields };