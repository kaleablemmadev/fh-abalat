import prisma from "@/src/lib/prisma";
import AttendanceGrid from "./components/AttendanceGrid";
import { notFound } from "next/navigation";

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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {event.title}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium ring-1 ring-inset ring-border">
            {event.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {event.location && (
            <>
              <span>•</span>
              <span className="text-sm">{event.location}</span>
            </>
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
