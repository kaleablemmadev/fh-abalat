// /scripts/backupDatabase.ts
import { prisma } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function backupDatabase() {
  console.log('📦 Creating database backup...');
  
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  try {
    // Get all data
    const [users, events, attendanceTypes, attendances, permissions, permissionTypes, eligibilityRules] = await Promise.all([
      prisma.user.findMany(),
      prisma.event.findMany(),
      prisma.attendanceType.findMany(),
      prisma.attendance.findMany(),
      prisma.permission.findMany(),
      prisma.permissionType.findMany(),
      prisma.eligibilityRule.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        users,
        events,
        attendanceTypes,
        attendances,
        permissions,
        permissionTypes,
        eligibilityRules,
      },
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved to: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  backupDatabase().catch(console.error);
}

export { backupDatabase };