import prisma from "@/src/lib/prisma";
import MezmurEligibilityReportClient from "./components/MezmurEligibilityReportClient";

export default async function MezmurEligibilityReportPage() {
  // Get all active mezmur events
  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      eventType: 'MEZMUR_EVENT',
      ethiopianYear: { not: null },
      ethiopianMonth: { not: null },
      ethiopianDay: { not: null },
    },
    include: {
      eligibilityRule: {
        include: {
          criteria: true,
        },
      },
      attendances: {
        include: {
          member: {
            select: {
              id: true,
              fullName: true,
              privateId: true,
            }
          },
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

  // Get all approved mezmur permissions
  const permissions = await prisma.permission.findMany({
    where: {
      status: 'APPROVED',
      mode: 'MEZMUR',
      memberId: { in: members.map(m => m.id) }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          የአገልግሎት መስፈርት ማሟላት ሪፖርቶች
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          ለአገልግሎቶች የሚሆኑ የመዝሙር ጥናት መስፈርቶችን ተመልከቱ
        </p>
      </div>

      <MezmurEligibilityReportClient
        events={events as any}
        members={members as any}
        permissions={permissions as any}
      />
    </div>
  );
}
