import prisma from "@/src/lib/prisma";
import EligibilityReportClient from "./components/EligibilityReportClient";

export default async function EligibilityReportPage() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: {
      classes: {
        where: { isActive: true },
        include: {
          courseEnrollments: {
            where: { status: "ACTIVE" },
            include: { student: true }
          },
          events: {
            where: { isActive: true }
          }
        }
      }
    }
  });

  if (!activeYear) {
    return (
      <div className="p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
        <p className="text-zinc-500">No active academic year found. Please initialize a year in Term Setup.</p>
      </div>
    );
  }

  // Get all approved course permissions for all students in these classes
  const studentIds = activeYear.classes.flatMap(c => c.courseEnrollments.map(e => e.studentId));
  const permissions = await prisma.permission.findMany({
    where: {
      memberId: { in: studentIds },
      status: "APPROVED",
      mode: "COURSE"
    }
  });

  // Also get all attendances for these students at these events
  const eventIds = activeYear.classes.flatMap(c => c.events.map(e => e.id));
  const attendances = await prisma.attendance.findMany({
    where: {
      eventId: { in: eventIds },
      memberId: { in: studentIds }
    },
    include: { attendanceType: true }
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          Exam Eligibility Report
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Real-time eligibility status for Mid and Final exams based on attendance and permissions.
        </p>
      </div>

      <EligibilityReportClient
        activeYear={activeYear}
        permissions={permissions}
        attendances={attendances}
      />
    </div>
  );
}
