import prisma from "@/src/lib/prisma";
import AttendanceGrid from "./components/AttendanceGrid";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";

export default async function SingleDayAttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  // 1. Fetch the Event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    notFound();
  }

  // 2. Fetch all Members
  const members = await prisma.user.findMany({
    where: { type: "MEMBER" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  // 3. Fetch all AttendanceTypes
  const attendanceTypes = await prisma.attendanceType.findMany({
    orderBy: { name: "asc" },
  });

  // 4. Fetch existing Attendance for this event
  const existingAttendances = await prisma.attendance.findMany({
    where: { eventId },
    select: { memberId: true, attendanceTypeId: true },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Event header ─────────────────────────────────────────────── */}
      <div
        className="pb-4"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}
      >
        <h1
          className="text-xl font-bold tracking-tight mb-2"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {event.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <Calendar size={11} />
            {event.date.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {event.location && (
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <MapPin size={11} />
              {event.location}
            </span>
          )}
        </div>
      </div>

      <AttendanceGrid
        eventId={eventId}
        members={members}
        attendanceTypes={attendanceTypes}
        initialAttendance={existingAttendances}
      />
    </div>
  );
}
