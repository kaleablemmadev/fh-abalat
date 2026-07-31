// /api/course/marks/bulk/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateFinalMark, getLetterGrade, getPassStatus } from "@/src/lib/courseGrading";

// Zod schema for bulk mark update
const bulkMarkSchema = z.object({
  courseYearId: z.string().min(1),
  marks: z.array(
    z.object({
      studentId: z.string().min(1),
      midExamScore: z.number().min(0).max(100).optional(),
      assignmentScore: z.number().min(0).max(100).optional(),
      finalExamScore: z.number().min(0).max(100).optional(),
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

    // Verify course year exists
    const courseYear = await prisma.courseYear.findUnique({
      where: { id: courseYearId },
    });

    if (!courseYear) {
      return NextResponse.json(
        { error: "Course year not found" },
        { status: 404 },
      );
    }

    // Use transaction to upsert all marks
    const result = await prisma.$transaction(
      marksData.map((markData) => {
        // Calculate computed score and letter grade
        const attendanceScore = 0; // TODO: Calculate from attendance records
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

        return prisma.mark.upsert({
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
      })
    );

    return NextResponse.json({ success: true, count: result.length }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to bulk update marks" },
      { status: 500 },
    );
  }
}
