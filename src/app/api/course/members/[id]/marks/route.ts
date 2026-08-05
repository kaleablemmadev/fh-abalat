import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CourseAttendanceService } from "@/src/services/course-attendance.service";
import { calculateFinalMark, getLetterGrade, getPassStatus } from "@/src/lib/courseGrading";

const bulkSaveSchema = z.object({
  marks: z.array(z.object({
    courseYearId: z.string(),
    midExamScore: z.number().optional(),
    assignmentScore: z.number().optional(),
    finalExamScore: z.number().optional(),
  }))
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;

    // 1. Find student and their active enrollment
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { courseClass: true }
        }
      }
    });

    if (!student || student.enrollments.length === 0) {
      return NextResponse.json({ error: "Active enrollment not found" }, { status: 404 });
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
      where: { studentId, courseYearId: { in: courseYears.map(cy => cy.id) } }
    });

    // 4. Combine data
    const data = await Promise.all(courseYears.map(async (cy) => {
      const mark = marks.find(m => m.courseYearId === cy.id);

      // Calculate attendance score for THIS specific course weight
      const weightedAttendance = await CourseAttendanceService.calculateStudentAttendanceScore(
        studentId,
        classId,
        cy.attendanceWeight
      );

      // Find rank
      const allMarks = await prisma.mark.findMany({
        where: { courseYearId: cy.id },
        select: { studentId: true, computedScore: true }
      });
      const sorted = allMarks.sort((a, b) => (b.computedScore || 0) - (a.computedScore || 0));
      const rank = sorted.findIndex(m => m.studentId === studentId) + 1;

      return {
        courseYearId: cy.id,
        courseName: cy.course.name,
        weights: {
          attendanceWeight: cy.attendanceWeight,
          midExamWeight: cy.midExamWeight,
          assignmentWeight: cy.assignmentWeight,
          finalExamWeight: cy.finalExamWeight,
        },
        currentMark: mark || null,
        currentRank: rank > 0 ? rank : null,
        weightedAttendance,
        isGradingComplete: cy.isGradingComplete
      };
    }));

    return NextResponse.json({
      studentName: student.fullName,
      courses: data
    });

  } catch (error) {
    console.error("Student Marks API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const body = await request.json();
    const { marks: marksData } = bulkSaveSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const savedMarks = [];

      for (const data of marksData) {
        // Fetch course year to get weights
        const cy = await tx.courseYear.findUnique({
          where: { id: data.courseYearId }
        });

        if (!cy) continue;

        // Calculate attendance score for this student in this class
        // (Re-calculate inside transaction for accuracy)
        const attendanceScore = await CourseAttendanceService.calculateStudentAttendanceScore(
          studentId,
          cy.courseClassId,
          cy.attendanceWeight
        );

        const computedScore = calculateFinalMark(
          {
            midExamScore: data.midExamScore,
            assignmentScore: data.assignmentScore,
            finalExamScore: data.finalExamScore,
          },
          {
            attendanceWeight: cy.attendanceWeight,
            midExamWeight: cy.midExamWeight,
            assignmentWeight: cy.assignmentWeight,
            finalExamWeight: cy.finalExamWeight,
          },
          attendanceScore
        );

        const letterGrade = getLetterGrade(computedScore);
        const passStatus = getPassStatus(letterGrade);

        const mark = await tx.mark.upsert({
          where: {
            studentId_courseYearId: {
              studentId,
              courseYearId: data.courseYearId
            }
          },
          update: {
            midExamScore: data.midExamScore,
            assignmentScore: data.assignmentScore,
            finalExamScore: data.finalExamScore,
            computedScore,
            letterGrade,
            passStatus
          },
          create: {
            studentId,
            courseYearId: data.courseYearId,
            midExamScore: data.midExamScore,
            assignmentScore: data.assignmentScore,
            finalExamScore: data.finalExamScore,
            computedScore,
            letterGrade,
            passStatus
          }
        });

        savedMarks.push(mark);
      }

      return savedMarks;
    }, {
        timeout: 30000
    });

    return NextResponse.json({ success: true, count: result.length });

  } catch (error) {
    console.error("Bulk mark save error:", error);
    return NextResponse.json({ error: "Failed to save marks" }, { status: 500 });
  }
}
