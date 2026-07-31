// /api/course/marks/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateFinalMark, getLetterGrade, getPassStatus } from "@/src/lib/courseGrading";

// Zod schema for Mark creation/update
const markSchema = z.object({
  studentId: z.string().min(1),
  courseYearId: z.string().min(1),
  midExamScore: z.number().min(0).max(100).optional(),
  assignmentScore: z.number().min(0).max(100).optional(),
  finalExamScore: z.number().min(0).max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const courseYearId = searchParams.get("courseYearId");

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (courseYearId) where.courseYearId = courseYearId;

    const marks = await prisma.mark.findMany({
      where,
      include: {
        student: true,
        courseYear: {
          include: {
            course: true,
            courseClass: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(marks);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load marks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = markSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { studentId, courseYearId, midExamScore, assignmentScore, finalExamScore } = validation.data;

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 },
      );
    }

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

    // Check if mark already exists
    const existing = await prisma.mark.findUnique({
      where: {
        studentId_courseYearId: {
          studentId,
          courseYearId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Mark already exists for this student and course year" },
        { status: 409 },
      );
    }

    // Calculate computed score and letter grade
    const attendanceScore = 0; // TODO: Calculate from attendance records
    const computedScore = calculateFinalMark(
      { midExamScore, assignmentScore, finalExamScore },
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

    const mark = await prisma.mark.create({
      data: {
        studentId,
        courseYearId,
        midExamScore,
        assignmentScore,
        finalExamScore,
        computedScore,
        letterGrade,
        passStatus,
      },
    });

    return NextResponse.json(mark, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create mark" },
      { status: 500 },
    );
  }
}
