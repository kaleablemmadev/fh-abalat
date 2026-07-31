// /api/course/course-years/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for CourseYear creation/update with weight validation
const courseYearSchema = z.object({
  courseId: z.string().min(1),
  courseClassId: z.string().min(1),
  year: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  semester: z.enum(["FIRST", "SECOND"]).optional(),
  isTwoSemesters: z.boolean().optional(),
  attendanceWeight: z.number().min(0).max(100).optional(),
  midExamWeight: z.number().min(0).max(100).optional(),
  assignmentWeight: z.number().min(0).max(100).optional(),
  finalExamWeight: z.number().min(0).max(100).optional(),
}).refine(
  (data) => {
    const weights = {
      attendanceWeight: data.attendanceWeight ?? 10,
      midExamWeight: data.midExamWeight ?? 25,
      assignmentWeight: data.assignmentWeight ?? 15,
      finalExamWeight: data.finalExamWeight ?? 50,
    };
    const sum = weights.attendanceWeight + weights.midExamWeight + weights.assignmentWeight + weights.finalExamWeight;
    return Math.abs(sum - 100) < 0.01; // Allow for floating point precision
  },
  {
    message: "Assessment weights must sum to exactly 100",
    path: ["weights"],
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const courseClassId = searchParams.get("courseClassId");
    const year = searchParams.get("year");

    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (courseClassId) where.courseClassId = courseClassId;
    if (year) where.year = year;

    const courseYears = await prisma.courseYear.findMany({
      where,
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
      orderBy: [{ year: "desc" }, { course: { name: "asc" } }],
    });
    return NextResponse.json(courseYears);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course years" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
        courseId, courseClassId, year, startDate, endDate,
        semester, isTwoSemesters,
        attendanceWeight, midExamWeight, assignmentWeight, finalExamWeight
    } = validation.data;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 },
      );
    }

    // Verify course class exists
    const courseClass = await prisma.courseClass.findUnique({
      where: { id: courseClassId },
    });

    if (!courseClass) {
      return NextResponse.json(
        { error: "Course class not found" },
        { status: 404 },
      );
    }

    // Check if course year offering already exists for this semester
    const existing = await prisma.courseYear.findFirst({
      where: {
        courseId,
        courseClassId,
        year,
        semester: semester as any || "FIRST"
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Course offering already exists for this course, class, year, and semester` },
        { status: 409 },
      );
    }

    const courseYear = await prisma.courseYear.create({
      data: {
        courseId,
        courseClassId,
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        semester: semester as any || "FIRST",
        isTwoSemesters: isTwoSemesters ?? false,
        attendanceWeight: attendanceWeight ?? 10,
        midExamWeight: midExamWeight ?? 25,
        assignmentWeight: assignmentWeight ?? 15,
        finalExamWeight: finalExamWeight ?? 50,
      },
    });

    return NextResponse.json(courseYear, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create course year" },
      { status: 500 },
    );
  }
}
