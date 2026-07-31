// /course/attendance/[classId]/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import CourseAttendanceGrid from "./components/CourseAttendanceGrid";
import { CourseAttendanceService } from "@/src/services/course-attendance.service";

async function getAdminId() {
  const admin = await prisma.user.findFirst({
    where: { type: "ADMIN" }
  }) || await prisma.user.findFirst({
    where: { type: "SUPERADMIN" }
  });
  return admin?.id || "system-admin";
}

export default async function CourseAttendancePage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const courseClass = await prisma.courseClass.findUnique({
    where: { id: classId },
  });

  if (!courseClass) {
    notFound();
  }

  // Auto-generate events if none exist and term dates are set
  const existingEventsCount = await prisma.event.count({
    where: { courseClassId: classId, isActive: true },
  });

  if (existingEventsCount === 0 && courseClass.startDate && courseClass.endDate) {
    const adminId = await getAdminId();
    await CourseAttendanceService.generateEventsForClass(classId, adminId);
  }

  // Get enrolled students for this class
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { 
      courseClassId: classId,
      status: "ACTIVE",
    },
    include: {
      student: true,
    },
    orderBy: { student: { fullName: "asc" } }
  });

  const students = enrollments.map((e) => e.student);

  // Get attendance types
  const attendanceTypes = await prisma.attendanceType.findMany({
    orderBy: { value: "desc" },
  });

  // Get events for this course class
  const events = await prisma.event.findMany({
    where: { 
      courseClassId: classId,
      isActive: true,
    },
    orderBy: { date: "asc" },
  });

  // Get existing attendance records
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      eventId: { in: events.map((e) => e.id) },
    },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Course Attendance
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {courseClass.name} - {courseClass.year}
        </p>
      </div>

      <CourseAttendanceGrid
        key={classId}
        classId={classId}
        students={students as any}
        attendanceTypes={attendanceTypes}
        events={events as any}
        initialAttendance={attendanceRecords}
      />
    </div>
  );
}
