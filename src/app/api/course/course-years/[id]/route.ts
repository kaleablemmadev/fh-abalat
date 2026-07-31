// /api/course/course-years/[id]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const courseYearSchema = z.object({
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  semester: z.enum(["FIRST", "SECOND"]).optional(),
  isTwoSemesters: z.boolean().optional(),
  attendanceWeight: z.number().min(0).max(100).optional(),
  midExamWeight: z.number().min(0).max(100).optional(),
  assignmentWeight: z.number().min(0).max(100).optional(),
  finalExamWeight: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    // Only validate weights if at least one weight is being updated
    const hasWeightUpdate = 
      data.attendanceWeight !== undefined ||
      data.midExamWeight !== undefined ||
      data.assignmentWeight !== undefined ||
      data.finalExamWeight !== undefined;
    
    if (!hasWeightUpdate) return true;
    
    const weights = {
      attendanceWeight: data.attendanceWeight,
      midExamWeight: data.midExamWeight,
      assignmentWeight: data.assignmentWeight,
      finalExamWeight: data.finalExamWeight,
    };
    
    // If any weight is provided, all must be provided for validation
    if (Object.values(weights).some(w => w !== undefined)) {
      const sum = (weights.attendanceWeight ?? 0) + (weights.midExamWeight ?? 0) + (weights.assignmentWeight ?? 0) + (weights.finalExamWeight ?? 0);
      return Math.abs(sum - 100) < 0.01;
    }
    
    return true;
  },
  {
    message: "Assessment weights must sum to exactly 100",
    path: ["weights"],
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseYear = await prisma.courseYear.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            instructor: true,
          },
        },
        courseClass: true,
        marks: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!courseYear) {
      return NextResponse.json(
        { error: "Course year not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(courseYear);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course year" },
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
    const validation = courseYearSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const {
        startDate, endDate, semester, isTwoSemesters,
        attendanceWeight, midExamWeight, assignmentWeight, finalExamWeight, isActive
    } = validation.data;

    const courseYear = await prisma.courseYear.update({
      where: { id },
      data: {
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(semester !== undefined && { semester: semester as any }),
        ...(isTwoSemesters !== undefined && { isTwoSemesters }),
        ...(attendanceWeight !== undefined && { attendanceWeight }),
        ...(midExamWeight !== undefined && { midExamWeight }),
        ...(assignmentWeight !== undefined && { assignmentWeight }),
        ...(finalExamWeight !== undefined && { finalExamWeight }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(courseYear);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update course year" },
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
    // Soft delete by setting isActive to false
    const courseYear = await prisma.courseYear.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(courseYear);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete course year" },
      { status: 500 },
    );
  }
}
