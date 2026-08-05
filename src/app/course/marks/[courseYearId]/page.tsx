// /course/marks/[courseYearId]/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import BulkGradingGrid from "./components/BulkGradingGrid";
import { CourseAttendanceService } from "@/src/services/course-attendance.service";

export default async function BulkGradingPage({ params }: { params: Promise<{ courseYearId: string }> }) {
  const { courseYearId } = await params;
  const courseYear = await prisma.courseYear.findUnique({
    where: { id: courseYearId },
    include: {
      course: {
        include: {
          instructor: true,
        },
      },
      courseClass: true,
      instructor: true, // Specific instructor for this year
      marks: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!courseYear) {
    notFound();
  }

  // Get enrolled students for this course class
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { 
      courseClassId: courseYear.courseClassId,
      status: "ACTIVE",
    },
    include: {
      student: true,
    },
    orderBy: { student: { fullName: "asc" } }
  });

  // Calculate attendance scores for each student
  const studentsWithData = await Promise.all(enrollments.map(async (enrollment) => {
    const attendanceScore = await CourseAttendanceService.calculateStudentAttendanceScore(
      enrollment.studentId,
      courseYear.courseClassId,
      courseYear.attendanceWeight
    );

    const mark = courseYear.marks.find(m => m.studentId === enrollment.studentId);

    return {
      student: enrollment.student,
      mark: mark || null,
      attendanceScore,
    };
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Bulk Grading
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          {courseYear.course.name} - {courseYear.courseClass.name} ({courseYear.year})
          <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase">
            Instructor: {courseYear.instructor?.fullName || courseYear.course.instructor.fullName}
          </span>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px] font-black uppercase">
            {courseYear.isTwoSemesters ? "Full Year" : `${courseYear.semester} Semester`}
          </span>
        </p>
      </div>

      <BulkGradingGrid
        courseYearId={courseYearId}
        studentsWithData={studentsWithData as any}
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
