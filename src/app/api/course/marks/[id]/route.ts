// /api/course/marks/[id]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateFinalMark, getLetterGrade, getPassStatus } from "@/src/lib/courseGrading";

const markSchema = z.object({
  midExamScore: z.number().min(0).max(100).optional(),
  assignmentScore: z.number().min(0).max(100).optional(),
  finalExamScore: z.number().min(0).max(100).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mark = await prisma.mark.findUnique({
      where: { id },
      include: {
        student: true,
        courseYear: {
          include: {
            course: true,
            courseClass: true,
          },
        },
      },
    });

    if (!mark) {
      return NextResponse.json(
        { error: "Mark not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(mark);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load mark" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate with Zod
    const validation = markSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { midExamScore, assignmentScore, finalExamScore } = validation.data;

    // Get existing mark to compute new score
    const existingMark = await prisma.mark.findUnique({
      where: { id },
      include: {
        courseYear: true,
      },
    });

    if (!existingMark) {
      return NextResponse.json(
        { error: "Mark not found" },
        { status: 404 },
      );
    }

    // Calculate computed score and letter grade
    const attendanceScore = 0; // TODO: Calculate from attendance records
    const computedScore = calculateFinalMark(
      {
        midExamScore: midExamScore ?? (existingMark.midExamScore ?? 0),
        assignmentScore: assignmentScore ?? (existingMark.assignmentScore ?? 0),
        finalExamScore: finalExamScore ?? (existingMark.finalExamScore ?? 0),
      },
      {
        attendanceWeight: existingMark.courseYear.attendanceWeight,
        midExamWeight: existingMark.courseYear.midExamWeight,
        assignmentWeight: existingMark.courseYear.assignmentWeight,
        finalExamWeight: existingMark.courseYear.finalExamWeight,
      },
      attendanceScore
    );
    const letterGrade = getLetterGrade(computedScore);
    const passStatus = getPassStatus(letterGrade);

    const mark = await prisma.mark.update({
      where: { id },
      data: {
        ...(midExamScore !== undefined && { midExamScore }),
        ...(assignmentScore !== undefined && { assignmentScore }),
        ...(finalExamScore !== undefined && { finalExamScore }),
        computedScore,
        letterGrade,
        passStatus,
      },
    });

    return NextResponse.json(mark);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update mark" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mark = await prisma.mark.delete({
      where: { id },
    });

    return NextResponse.json(mark);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete mark" },
      { status: 500 },
    );
  }
}
