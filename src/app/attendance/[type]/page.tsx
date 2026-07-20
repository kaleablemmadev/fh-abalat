/* /attendance/[type]/page.tsx */
import prisma from "@/src/lib/prisma";
import MultiMonthGrid from "../components/MultiMonthGrid";
import { notFound } from "next/navigation";
import { EthDateTime } from "ethiopian-calendar-date-converter";
import Link from "next/link";

// Dummy admin fallback if no auth is available
async function getAdminId() {
  const admin = await prisma.user.findFirst({ where: { type: "ADMIN" } }) || 
                await prisma.user.findFirst({ where: { type: "SUPERADMIN" } });
  return admin?.id || "dummy-admin-id";
}

export default async function MultiMonthAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { type } = await params;
  const { month, year } = await searchParams;

  const validTypes = ['chore', 'sunday'];
  if (!validTypes.includes(type)) {
    notFound();
  }

  const currentDate = new Date();
  const currentMonth = month ? parseInt(month, 10) - 1 : currentDate.getMonth(); // 0-indexed
  const currentYear = year ? parseInt(year, 10) : currentDate.getFullYear();

  // Determine dates for the events in this month
  const eventDates: Date[] = [];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    
    if (type === 'sunday') {
      if (date.getDay() === 0) { // 0 is Sunday
        eventDates.push(date);
      }
    } else if (type === 'chore') {
      // Convert to Ethiopian date
      const ethDate = EthDateTime.fromEuropeanDate(date);
      const targetEthDays = [1, 12, 21, 23, 24];
      if (targetEthDays.includes(ethDate.date)) {
        eventDates.push(date);
      }
    }
  }

  const adminId = await getAdminId();
  const eventIds: string[] = [];
  const generatedEvents = [];

  // Generate or find events
  for (const date of eventDates) {
    const title = type === 'sunday' ? 'Sunday Morning Attendance' : 'Chore Attendance';
    
    // We check for events on the exact date and with similar title to avoid duplicates
    let event = await prisma.event.findFirst({
      where: {
        title,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        }
      }
    });

    if (!event) {
      event = await prisma.event.create({
        data: {
          title,
          date: new Date(date.setHours(12, 0, 0, 0)), // set to noon to avoid timezone shift issues
          createdById: adminId,
        }
      });
    }

    eventIds.push(event.id);
    generatedEvents.push(event);
  }

  // Fetch Members
  const members = await prisma.user.findMany({
    where: { type: "MEMBER" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  // Fetch AttendanceTypes
  const attendanceTypes = await prisma.attendanceType.findMany({
    orderBy: { name: "asc" },
  });

  // Try to find a Permission type to allow future marking
  const permissionType = attendanceTypes.find(t => t.name.toLowerCase().includes('permission'));

  // Fetch existing attendance for these events
  const existingAttendances = await prisma.attendance.findMany({
    where: {
      eventId: { in: eventIds },
    },
    select: { memberId: true, eventId: true, attendanceTypeId: true, permissionId: true },
  });

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div>
          <h1
            className="text-xl font-bold tracking-tight capitalize"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {type} Attendance
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {monthName} {currentYear}
          </p>
        </div>

        {/* Segmented control — Chore / Sunday */}
        <div
          className="inline-flex items-center p-0.5 rounded"
          style={{
            background: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <Link
            href="/attendance/chore"
            className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150"
            style={
              type === 'chore'
                ? {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }
                : {
                    background: 'transparent',
                    color: 'hsl(var(--muted-foreground))',
                  }
            }
          >
            Chore
          </Link>
          <Link
            href="/attendance/sunday"
            className="px-3 py-1.5 rounded text-xs font-semibold transition-all duration-150"
            style={
              type === 'sunday'
                ? {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }
                : {
                    background: 'transparent',
                    color: 'hsl(var(--muted-foreground))',
                  }
            }
          >
            Sunday
          </Link>
        </div>
      </div>

      <MultiMonthGrid
        events={generatedEvents}
        members={members}
        attendanceTypes={attendanceTypes}
        initialAttendance={existingAttendances}
        permissionTypeId={permissionType?.id || null}
      />
    </div>
  );
}
