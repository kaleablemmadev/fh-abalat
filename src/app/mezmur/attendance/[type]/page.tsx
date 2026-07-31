import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import MezmurAttendanceGrid from "../components/MezmurAttendanceGrid";
import { MezmurAttendanceService } from "@/src/services/mezmur-attendance.service";
import { getEthiopianToday, ethMonthNames } from "@/src/lib/ethiopiancal";

async function getAdminId() {
  const admin = await prisma.user.findFirst({
    where: { type: "ADMIN" }
  }) || await prisma.user.findFirst({
    where: { type: "SUPERADMIN" }
  });
  return admin?.id || "system-admin";
}

const typeMap: Record<string, string> = {
  regular: "MEZMUR_REGULAR",
  beginners: "MEZMUR_BEGINNERS",
  continuous: "MEZMUR_CONTINUOUS",
};

const groupTypeMap: Record<string, string> = {
  regular: "CONTINUOUS", // Regular singers are usually the continuous group
  beginners: "BEGINNERS",
  continuous: "CONTINUOUS",
};

export default async function MezmurAttendanceTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { type } = await params;
  const { month, year } = await searchParams;

  const eventType = typeMap[type];
  if (!eventType) notFound();

  const adminId = await getAdminId();
  const todayEth = getEthiopianToday();
  const currentEthYear = year ? parseInt(year, 10) : todayEth.year;

  let currentEthMonth = month ? parseInt(month, 10) : 0;
  if (!month) {
    for (const [key, value] of Object.entries(ethMonthNames)) {
      if (value === todayEth.month) {
        currentEthMonth = parseInt(key);
        break;
      }
    }
  }

  // Auto-generate Sundays for Regular
  if (type === "regular") {
    await MezmurAttendanceService.generateSundayEvents(currentEthYear, currentEthMonth, adminId);
  }

  let members = [];

  if (type === "regular") {
    // Fetch only active REGULAR_MEMBER types from Abalat
    members = await prisma.user.findMany({
      where: {
        type: "MEMBER",
        isActive: true,
        memberType: "REGULAR_MEMBER"
      },
      orderBy: { fullName: "asc" },
    });
  } else {
    // Fetch group enrollment for Beginners/Continuous
    const groupType = groupTypeMap[type] as any;
    const enrollments = await prisma.mezmurEnrollment.findMany({
      where: { groupType, status: "ACTIVE" },
      include: { student: true },
      orderBy: { student: { fullName: "asc" } },
    });
    members = enrollments.map((e) => e.student);
  }

  // Fetch events for this month/type
  const events = await prisma.event.findMany({
    where: {
      eventType: eventType as any,
      ethiopianYear: currentEthYear,
      ethiopianMonth: currentEthMonth,
      isActive: true,
    },
    orderBy: { date: "asc" },
  });

  const attendanceTypes = await prisma.attendanceType.findMany({
    orderBy: { value: "desc" },
  });

  const initialAttendance = await prisma.attendance.findMany({
    where: {
      eventId: { in: events.map((e) => e.id) },
    },
    select: { memberId: true, eventId: true, attendanceTypeId: true },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight capitalize" style={{ color: "hsl(var(--foreground))" }}>
            {type} Attendance
          </h1>
          <p className="text-sm opacity-50">
            {ethMonthNames[currentEthMonth]} {currentEthYear} ዓ.ም.
          </p>
        </div>
      </div>

      <MezmurAttendanceGrid
        key={`${type}_${currentEthYear}_${currentEthMonth}`}
        type={type}
        events={events as any}
        members={members as any}
        attendanceTypes={attendanceTypes}
        initialAttendance={initialAttendance}
        adminId={adminId}
      />
    </div>
  );
}
