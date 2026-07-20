// /prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { getEthiopianToday, getChoreDaysInMonth, getSundaysInMonth, ethiopianDateToDate } from '../src/lib/ethiopiancal';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database (preserving existing data)...');

  // Get current Ethiopian date
  const today = getEthiopianToday();
  const currentYear = today.year;
  const currentMonth = parseInt(Object.keys(today.month).find(key => today.month === key) || '1');

  // ─── Attendance Types ───────────────────────────────────────────────
  // Only create if they don't exist
  const attendanceTypes = [
    { name: 'Attended', value: 1, isDefault: true },
    { name: 'Permission', value: 0.5, isDefault: false },
    { name: 'Absent', value: 0, isDefault: false },
    { name: 'Late', value: 0.5, isDefault: false },
  ];

  console.log('📋 Checking attendance types...');
  for (const type of attendanceTypes) {
    const existing = await prisma.attendanceType.findUnique({
      where: { name: type.name },
    });
    
    if (!existing) {
      await prisma.attendanceType.create({
        data: type,
      });
      console.log(`  ✅ Created "${type.name}"`);
    } else {
      console.log(`  ⏭️  "${type.name}" already exists, skipping`);
    }
  }

  // ─── Admin User ─────────────────────────────────────────────────────
  console.log('👤 Checking admin user...');
  const admin = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: 'admin@example.com' },
        { type: 'SUPERADMIN' },
      ],
    },
  });

  let adminId: string;
  
  if (!admin) {
    const newAdmin = await prisma.user.create({
      data: {
        fullName: 'Admin User',
        email: 'admin@example.com',
        type: 'SUPERADMIN',
        gender: 'MALE',
        age: 30,
      },
    });
    adminId = newAdmin.id;
    console.log(`  ✅ Created admin user: ${newAdmin.fullName} (${newAdmin.id})`);
  } else {
    adminId = admin.id;
    console.log(`  ⏭️  Admin user already exists: ${admin.fullName} (${admin.id})`);
  }

  // ─── Sample Members ─────────────────────────────────────────────────
  // Only create if no members exist
  console.log('👥 Checking members...');
  const existingMembers = await prisma.user.count({
    where: { type: 'MEMBER' },
  });

  if (existingMembers === 0) {
    const members = [
      { fullName: 'John Doe', gender: 'MALE' as const, age: 25, memberType: 'REGULAR_MEMBER' as const },
      { fullName: 'Jane Smith', gender: 'FEMALE' as const, age: 22, memberType: 'COURSE_STUDENT' as const },
      { fullName: 'Bob Johnson', gender: 'MALE' as const, age: 19, memberType: 'YOUTH_STUDENT' as const },
    ];

    for (const member of members) {
      const created = await prisma.user.create({
        data: {
          ...member,
          type: 'MEMBER',
          registerDate: `${today.month} ${today.day}, ${today.year}`,
        },
      });
      console.log(`  ✅ Created member: ${created.fullName}`);
    }
  } else {
    console.log(`  ⏭️  ${existingMembers} members already exist, skipping sample members`);
  }

  // ─── Events ────────────────────────────────────────────────────────
  console.log('📅 Checking events...');
  
  // Helper to create events only if they don't exist
  async function createEventIfNotExists(
    title: string,
    ethDay: { year: number; month: string; day: number },
    adminId: string
  ) {
    const gregDate = ethiopianDateToDate(ethDay);
    
    // Check if event already exists for this date and type
    const existing = await prisma.event.findFirst({
      where: {
        date: {
          gte: new Date(gregDate.setHours(0, 0, 0, 0)),
          lt: new Date(gregDate.setHours(23, 59, 59, 999)),
        },
        title: {
          contains: title.split(' ')[0], // "Chore" or "Sunday"
        },
      },
    });

    if (!existing) {
      const event = await prisma.event.create({
        data: {
          title,
          date: gregDate,
          ethiopianYear: ethDay.year,
          ethiopianMonth: parseInt(Object.keys(today.month).find(key => today.month === key) || '1'),
          ethiopianDay: ethDay.day,
          createdById: adminId,
          targetMemberTypes: ['REGULAR_MEMBER', 'COURSE_STUDENT', 'YOUTH_STUDENT'],
        },
      });
      console.log(`  ✅ Created event: ${title} - ${ethDay.month} ${ethDay.day}`);
      return event;
    } else {
      console.log(`  ⏭️  Event already exists for ${ethDay.month} ${ethDay.day}, skipping`);
      return existing;
    }
  }

  // Create chore events
  console.log('  📅 Checking chore events...');
  const choreDays = getChoreDaysInMonth(currentYear, currentMonth);
  for (const ethDay of choreDays) {
    await createEventIfNotExists('Chore Attendance', ethDay, adminId);
  }

  // Create Sunday events
  console.log('  📅 Checking Sunday events...');
  const sundays = getSundaysInMonth(currentYear, currentMonth);
  for (const ethDay of sundays) {
    await createEventIfNotExists('Sunday Morning Attendance', ethDay, adminId);
  }

  // ─── Summary ──────────────────────────────────────────────────────
  const finalCounts = await Promise.all([
    prisma.user.count({ where: { type: 'MEMBER' } }),
    prisma.event.count(),
    prisma.attendanceType.count(),
    prisma.user.count({ where: { type: 'SUPERADMIN' } }),
  ]);

  console.log('\n📊 Final Database Summary:');
  console.log(`  👥 Members: ${finalCounts[0]}`);
  console.log(`  📅 Events: ${finalCounts[1]}`);
  console.log(`  📋 Attendance Types: ${finalCounts[2]}`);
  console.log(`  👤 Admins: ${finalCounts[3]}`);
  
  console.log('\n✅ Seeding complete! All existing data preserved.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });