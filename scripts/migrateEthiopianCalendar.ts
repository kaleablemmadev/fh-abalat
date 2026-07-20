// scripts/migrateEthiopianCalendar.ts
import { backupDatabase } from './backupDatabase';
import { addEthiopianFields } from './addEthiopianFields';
import { updateEthiopianDates } from './updateEthiopianDates.ts';

async function migrateEthiopianCalendar() {
  console.log('🚀 Starting Ethiopian calendar migration...\n');
  
  try {
    // Step 1: Backup
    console.log('📦 Step 1: Creating backup...');
    await backupDatabase();
    console.log('✅ Backup complete\n');

    // Step 2: Add fields
    console.log('📝 Step 2: Adding Ethiopian fields...');
    await addEthiopianFields();
    console.log('✅ Fields added\n');

    // Step 3: Update data
    console.log('🔄 Step 3: Updating existing data...');
    await updateEthiopianDates();
    console.log('✅ Data updated\n');

    console.log('🎉 Migration complete!');
    console.log('📊 You can now use Ethiopian calendar features.');
    console.log('ℹ️  Backup file is in the /backups directory.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  migrateEthiopianCalendar().catch(console.error);
}

export { migrateEthiopianCalendar };