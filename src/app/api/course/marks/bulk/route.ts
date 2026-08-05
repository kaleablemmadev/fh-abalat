// /api/course/marks/bulk/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateFinalMark, getLetterGrade, getPassStatus } from "@/src/lib/courseGrading";
import { CourseAttendanceService } from "@/src/services/course-attendance.service";
import { isWithinAcademicYearTimeline } from "@/src/lib/utils";

// Zod schema for bulk mark update
const bulkMarkSchema = z.object({
  courseYearId: z.string().min(1),
  marks: z.array(
    z.object({
      studentId: z.string().min(1),
      midExamScore: z.number().min(0).optional(),
      assignmentScore: z.number().min(0).optional(),
      finalExamScore: z.number().min(0).optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = bulkMarkSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { courseYearId, marks: marksData } = validation.data;

    // Verify course year exists and check academic year timeline
    const courseYear = await prisma.courseYear.findUnique({
      where: { id: courseYearId },
      include: {
        courseClass: {
          include: {
            academicYear: true
          }
        }
      }
    });

    if (!courseYear) {
      return NextResponse.json(
        { error: "Course year not found" },
        { status: 404 },
      );
    }

    // Check if current date is within academic year timeline
    if (courseYear.courseClass?.academicYear) {
      const { startDate, endDate } = courseYear.courseClass.academicYear;
      
      if (!isWithinAcademicYearTimeline(new Date(startDate), new Date(endDate))) {
        return NextResponse.json(
          { error: "Cannot update marks outside the academic year timeline. Only registration and basic updates are allowed." },
          { status: 400 }
        );
      }
    }

    // Use transaction to upsert all marks
    // Execute sequentially to avoid driver issues in transactions
    const result = await prisma.$transaction(async (tx) => {
      const savedMarks = [];

      for (const markData of marksData) {
        // Calculate attendance score from records
        const attendanceScore = await CourseAttendanceService.calculateStudentAttendanceScore(
          markData.studentId,
          courseYear.courseClassId,
          courseYear.attendanceWeight
        );

        const computedScore = calculateFinalMark(
          {
            midExamScore: markData.midExamScore,
            assignmentScore: markData.assignmentScore,
            finalExamScore: markData.finalExamScore,
          },
          {
            attendanceWeight: courseYear.attendanceWeight,
            midExamWeight: courseYear.midExamWeight,
            assignmentWeight: courseYear.assignmentWeight,
            finalExamWeight: courseYear.finalExamWeight,
          },
          attendanceScore
        );
        const letterGrade = getLetterGrade(computedScore);
        const passStatus = getPassStatus(letterGrade);

        const upsertedMark = await tx.mark.upsert({
          where: {
            studentId_courseYearId: {
              studentId: markData.studentId,
              courseYearId,
            },
          },
          update: {
            midExamScore: markData.midExamScore,
            assignmentScore: markData.assignmentScore,
            finalExamScore: markData.finalExamScore,
            computedScore,
            letterGrade,
            passStatus,
          },
          create: {
            studentId: markData.studentId,
            courseYearId,
            midExamScore: markData.midExamScore,
            assignmentScore: markData.assignmentScore,
            finalExamScore: markData.finalExamScore,
            computedScore,
            letterGrade,
            passStatus,
          },
        });
        savedMarks.push(upsertedMark);
      }
      return savedMarks;
    }, {
      timeout: 30000
    });

    return NextResponse.json({ success: true, count: result.length }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to bulk update marks" },
      { status: 500 },
    );
  }
}
