import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const courseFreeDayUpdateSchema = z.object({
  date: z.string().optional(),
  reason: z.string().optional(),
  isAnnual: z.boolean().optional(),
  ethiopianYear: z.number().optional(),
  ethiopianMonth: z.number().optional(),
  ethiopianDay: z.number().optional(),
  notificationsSent: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const courseFreeDay = await prisma.courseFreeDay.findUnique({
      where: { id },
      include: {
        courseYear: {
          include: {
            course: true,
            courseClass: true,
          },
        },
      },
    });

    if (!courseFreeDay) {
      return NextResponse.json(
        { error: "Course-free day not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(courseFreeDay);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course-free day" },
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
    const validation = courseFreeDayUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const {
      date,
      reason,
      isAnnual,
      ethiopianYear,
      ethiopianMonth,
      ethiopianDay,
      notificationsSent,
    } = validation.data;

    // Check if course-free day exists
    const existing = await prisma.courseFreeDay.findUnique({
      where: { id },
      include: {
        courseYear: {
          include: {
            courseClass: {
              include: {
                academicYear: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Course-free day not found" },
        { status: 404 },
      );
    }

    // If date is being changed, check if new date is within academic year timeline
    if (date && existing.courseYear.courseClass?.academicYear) {
      const { startDate, endDate } = existing.courseYear.courseClass.academicYear;
      const newDate = new Date(date);
      
      if (newDate < new Date(startDate) || newDate > new Date(endDate)) {
        return NextResponse.json(
          { error: "Course-free day must be within the academic year timeline" },
          { status: 400 },
        );
      }
    }

    // Check if new date conflicts with existing record (if date is being changed)
    if (date && date !== existing.date.toISOString()) {
      const conflict = await prisma.courseFreeDay.findUnique({
        where: {
          courseYearId_date: {
            courseYearId: existing.courseYearId,
            date: new Date(date),
          },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "Course-free day already exists for this date and course year" },
          { status: 409 },
        );
      }
    }

    const courseFreeDay = await prisma.courseFreeDay.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(reason !== undefined && { reason }),
        ...(isAnnual !== undefined && { isAnnual }),
        ...(ethiopianYear !== undefined && { ethiopianYear }),
        ...(ethiopianMonth !== undefined && { ethiopianMonth }),
        ...(ethiopianDay !== undefined && { ethiopianDay }),
        ...(notificationsSent !== undefined && { notificationsSent }),
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

    return NextResponse.json(courseFreeDay);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update course-free day" },
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

    const courseFreeDay = await prisma.courseFreeDay.delete({
      where: { id },
    });

    return NextResponse.json(courseFreeDay);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete course-free day" },
      { status: 500 },
    );
  }
}
