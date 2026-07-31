// /course/marks/[courseYearId]/[studentId]/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import StudentMarkForm from "./components/StudentMarkForm";
import { CourseAttendanceService } from "@/src/services/course-attendance.service";

export default async function StudentMarkPage({ params }: { params: Promise<{ courseYearId: string; studentId: string }> }) {
  const { courseYearId, studentId } = await params;
  const courseYear = await prisma.courseYear.findUnique({
    where: { id: courseYearId },
    include: {
      course: {
        include: {
          instructor: true,
        },
      },
      courseClass: true,
    },
  });

  if (!courseYear) {
    notFound();
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    notFound();
  }

  const mark = await prisma.mark.findUnique({
    where: {
      studentId_courseYearId: {
        studentId,
        courseYearId,
      },
    },
  });

  const attendanceScore = await CourseAttendanceService.calculateStudentAttendanceScore(
    studentId,
    courseYear.courseClassId
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Student Grading
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {student.fullName || "Unnamed student"} • {courseYear.course.name} - {courseYear.courseClass.name} ({courseYear.year})
        </p>
      </div>

      <StudentMarkForm
        courseYearId={courseYearId}
        studentId={studentId}
        initialMark={mark}
        attendanceScore={attendanceScore}
        weights={{
          attendanceWeight: courseYear.attendanceWeight,
          midExamWeight: courseYear.midExamWeight,
          assignmentWeight: courseYear.assignmentWeight,
          finalExamWeight: courseYear.finalExamWeight,
        }}
      />
    </div>
  );
}
