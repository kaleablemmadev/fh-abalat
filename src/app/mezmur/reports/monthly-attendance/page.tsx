import prisma from "@/src/lib/prisma";
import MezmurMonthlyAttendanceReportClient from "./components/MezmurMonthlyAttendanceReportClient";
import { getEthiopianToday } from "@/src/lib/ethiopiancal";

export default async function MezmurMonthlyAttendanceReportPage() {
  const today = getEthiopianToday();

  // Get all active mezmur members
  const members = await prisma.user.findMany({
    where: {
      type: 'MEMBER',
      isActive: true,
      OR: [
        { memberType: 'REGULAR_MEMBER' },
        { mezmurEnrollments: { some: { status: 'ACTIVE' } } }
      ]
    },
    select: {
      id: true,
      fullName: true,
      privateId: true,
      memberType: true,
    },
    orderBy: { fullName: 'asc' }
  });

  // Get all mezmur events
  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      eventType: 'EVENT',
      ethiopianYear: { not: null },
      ethiopianMonth: { not: null },
      ethiopianDay: { not: null },
    },
    include: {
      attendances: {
        include: {
          attendanceType: true,
          permission: true,
        }
      }
    },
    orderBy: [
      { ethiopianYear: 'asc' },
      { ethiopianMonth: 'asc' },
      { ethiopianDay: 'asc' }
    ]
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          ወርኃሚ አቴንዳንስ ሪፖርት
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          የአባላት ወርኃዊ የመዝሙር ጥናት አቴንዳንስ ሪፖርቶች
        </p>
      </div>

      <MezmurMonthlyAttendanceReportClient
        members={members as any}
        events={events as any}
        currentEthiopianDate={today}
      />
    </div>
  );
}
