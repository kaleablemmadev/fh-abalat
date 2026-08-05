import { notFound } from "next/navigation";
import prisma from "@/src/lib/prisma";
import StudentAllMarksForm from "./components/StudentAllMarksForm";
import { CourseAttendanceService } from "@/src/services/course-attendance.service";

export default async function GradeStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;

  // 1. Find student and their active enrollment
  const student = await prisma.user.findFirst({
    where: {
        OR: [
            { id: studentId },
            { privateId: studentId }
        ]
    },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { courseClass: true }
      }
    }
  });

  if (!student || student.enrollments.length === 0) {
    notFound();
  }

  const enrollment = student.enrollments[0];
  const classId = enrollment.courseClassId!;

  // 2. Get all CourseYear records for this class
  const courseYears = await prisma.courseYear.findMany({
    where: { courseClassId: classId, isActive: true },
    include: { course: true }
  });

  // 3. Get existing marks
  const marks = await prisma.mark.findMany({
    where: { studentId: student.id, courseYearId: { in: courseYears.map(cy => cy.id) } }
  });

  // 4. Calculate Attendance Score
  const attendanceScore = await CourseAttendanceService.calculateStudentAttendanceScore(student.id, classId);

  // 5. Transform data for the client
  const courses = courseYears.map(cy => {
    const mark = marks.find(m => m.courseYearId === cy.id);
    return {
      courseYearId: cy.id,
      courseName: cy.course.name,
      weights: {
        attendanceWeight: cy.attendanceWeight,
        midExamWeight: cy.midExamWeight,
        assignmentWeight: cy.assignmentWeight,
        finalExamWeight: cy.finalExamWeight,
      },
      currentMark: mark ? {
        midExamScore: mark.midExamScore,
        assignmentScore: mark.assignmentScore,
        finalExamScore: mark.finalExamScore,
      } : null,
      currentRank: null,
      weightedAttendance: 0,
      isGradingComplete: cy.isGradingComplete
    };
  });

  return (
    <StudentAllMarksForm
      studentId={student.id}
      studentName={student.fullName || "Unnamed student"}
      attendanceScore={attendanceScore}
      courses={courses}
    />
  );
}
