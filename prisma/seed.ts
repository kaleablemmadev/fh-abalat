import prisma from "@/src/lib/prisma";

async function main() {
  // --- Attendance Types ---
  const [attended, permission, absent] = await Promise.all([
    prisma.attendanceType.upsert({
      where: { name: "Attended" },
      update: {},
      create: { name: "Attended", value: 1.0, isDefault: true },
    }),
    prisma.attendanceType.upsert({
      where: { name: "Permission" },
      update: {},
      create: { name: "Permission", value: 0.5, isDefault: true },
    }),
    prisma.attendanceType.upsert({
      where: { name: "Absent" },
      update: {},
      create: { name: "Absent", value: 0.0, isDefault: true },
    }),
  ]);

  // --- Permission Types ---
  const [medical, travel, work] = await Promise.all([
    prisma.permissionType.upsert({
      where: { name: "Medical" },
      update: {},
      create: { name: "Medical", description: "Health-related absence" },
    }),
    prisma.permissionType.upsert({
      where: { name: "Travel" },
      update: {},
      create: { name: "Travel", description: "Out of town / traveling" },
    }),
    prisma.permissionType.upsert({
      where: { name: "Work" },
      update: {},
      create: { name: "Work", description: "Work-related conflict" },
    }),
  ]);

  // --- Eligibility Rule ---
  const eligibilityRule = await prisma.eligibilityRule.create({
    data: {
      name: "Standard Eligibility",
      minAttendanceScore: 0.75,
      minEventsCount: 5,
      lookbackEventCount: 10,
    },
  });

  // --- Users ---
  const superadmin = await prisma.user.create({
    data: {
      fullName: "Super Admin",
      email: "superadmin@example.com",
      type: "SUPERADMIN",
      age: 35,
      gender: "MALE",
    },
  });

  const admin = await prisma.user.create({
    data: {
      fullName: "Regular Admin",
      email: "admin@example.com",
      type: "ADMIN",
      age: 30,
      gender: "FEMALE",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      fullName: "John Member",
      type: "MEMBER",
      memberType: "REGULAR_MEMBER",
      age: 22,
      gender: "MALE",
    },
  });

  const member2 = await prisma.user.create({
    data: {
      fullName: "Jane Student",
      type: "MEMBER",
      memberType: "YOUTH_STUDENT",
      age: 17,
      gender: "FEMALE",
    },
  });

  // --- Event ---
  const event = await prisma.event.create({
    data: {
      title: "Weekly Gathering",
      description: "Regular weekly meeting",
      date: new Date(),
      location: "Main Hall",
      createdById: admin.id,
      eligibilityRuleId: eligibilityRule.id,
      targetMemberTypes: ["REGULAR_MEMBER", "YOUTH_STUDENT"],
    },
  });

  // --- Sample Attendance ---
  await prisma.attendance.create({
    data: {
      memberId: member1.id,
      eventId: event.id,
      attendanceTypeId: attended.id,
      markedById: admin.id,
    },
  });

  const perm = await prisma.permission.create({
    data: {
      memberId: member2.id,
      permissionTypeId: medical.id,
      reason: "Doctor's appointment",
      status: "APPROVED",
      reviewedById: admin.id,
    },
  });

  await prisma.attendance.create({
    data: {
      memberId: member2.id,
      eventId: event.id,
      attendanceTypeId: permission.id,
      permissionId: perm.id,
      markedById: admin.id,
    },
  });

  console.log("Seed completed:");
  console.log({ superadmin: superadmin.email, admin: admin.email });
  console.log({ member1: member1.fullName, member2: member2.fullName });
  console.log({ event: event.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });