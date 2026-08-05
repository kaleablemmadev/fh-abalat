import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const courseFreeDaySchema = z.object({
  courseYearId: z.string().min(1),
  date: z.string().min(1),
  reason: z.string().min(1),
  isAnnual: z.boolean().optional(),
  ethiopianYear: z.number().optional(),
  ethiopianMonth: z.number().optional(),
  ethiopianDay: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseYearId = searchParams.get("courseYearId");
    const isAnnual = searchParams.get("isAnnual");

    const where: any = {};
    if (courseYearId) where.courseYearId = courseYearId;
    if (isAnnual) where.isAnnual = isAnnual === "true";

    const courseFreeDays = await prisma.courseFreeDay.findMany({
      where,
      include: {
        courseYear: {
          include: {
            course: true,
            courseClass: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(courseFreeDays);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course-free days" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = courseFreeDaySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const {
      courseYearId,
      date,
      reason,
      isAnnual,
      ethiopianYear,
      ethiopianMonth,
      ethiopianDay,
    } = validation.data;

    // Check if course year exists
    const courseYear = await prisma.courseYear.findUnique({
      where: { id: courseYearId },
      include: {
        courseClass: {
          include: {
            academicYear: true,
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

    // Check if date is within academic year timeline
    if (courseYear.courseClass?.academicYear) {
      const { startDate, endDate } = courseYear.courseClass.academicYear;
      const freeDayDate = new Date(date);
      
      if (freeDayDate < new Date(startDate) || freeDayDate > new Date(endDate)) {
        return NextResponse.json(
          { error: "Course-free day must be within the academic year timeline" },
          { status: 400 },
        );
      }
    }

    // Check if date already exists for this course year
    const existing = await prisma.courseFreeDay.findUnique({
      where: {
        courseYearId_date: {
          courseYearId,
          date: new Date(date),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Course-free day already exists for this date and course year" },
        { status: 409 },
      );
    }

    const courseFreeDay = await prisma.courseFreeDay.create({
      data: {
        courseYearId,
        date: new Date(date),
        reason,
        isAnnual: isAnnual ?? false,
        ethiopianYear,
        ethiopianMonth,
        ethiopianDay,
      },
      include: {
        courseYear: {
          include: {
            course: true,
            courseClass: true,
          },
        },
      },
    });

    return NextResponse.json(courseFreeDay, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create course-free day" },
      { status: 500 },
    );
  }
}
