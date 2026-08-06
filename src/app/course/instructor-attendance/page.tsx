import prisma from "@/src/lib/prisma";
import InstructorAttendanceGlobal from "./components/InstructorAttendanceGlobal";

export const dynamic = 'force-dynamic';

export default async function InstructorAttendancePage() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  // Fetch events for the active year (or recent events if no active year)
  // We'll show events from the last 14 days and next 14 days
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(now.getDate() - 14);
  const rangeEnd = new Date(now);
  rangeEnd.setDate(now.getDate() + 14);

  const events = await prisma.event.findMany({
    where: {
      mode: 'COURSE',
      isActive: true,
      ...(activeYear ? {
        courseClass: {
          academicYearId: activeYear.id
        }
      } : {
        date: {
          gte: rangeStart,
          lte: rangeEnd
        }
      })
    },
    include: {
      courseClass: true
    },
    orderBy: { date: 'desc' }
  });

  const instructors = await prisma.instructor.findMany({
    where: { isActive: true },
    orderBy: { fullName: 'asc' }
  });

  const courses = await prisma.course.findMany({
    where: { isGiven: true },
    orderBy: { name: 'asc' }
  });

  const attendanceTypes = await prisma.attendanceType.findMany({
    where: { mode: 'COURSE' },
    orderBy: { value: 'desc' }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">የመምህራን አቴንዳንስ (Instructor Attendance)</h1>
        <p className="text-sm mt-0.5 text-[hsl(var(--muted-foreground))]">
          Manage instructor presence, substitution credits, and absence records.
        </p>
      </div>

      <InstructorAttendanceGlobal
        events={events}
        instructors={instructors}
        courses={courses}
        attendanceTypes={attendanceTypes}
      />
    </div>
  );
}
