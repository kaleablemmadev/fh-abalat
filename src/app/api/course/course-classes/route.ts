// /api/course/course-classes/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for CourseClass creation/update
const courseClassSchema = z.object({
  name: z.enum(["KEDAMAY", "KALEAY", "SALSAY", "RABEAY", "KEREMT"]),
  year: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET() {
  try {
    const courseClasses = await prisma.courseClass.findMany({
      where: { isActive: true },
      include: {
        courseYears: {
          include: {
            course: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(courseClasses);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course classes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = courseClassSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { name, year, startDate, endDate } = validation.data;

    // Check if class already exists for this year
    const existing = await prisma.courseClass.findUnique({
      where: {
        name_year: {
          name,
          year,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Course class ${name} already exists for year ${year}` },
        { status: 409 },
      );
    }

    const courseClass = await prisma.courseClass.create({
      data: {
        name,
        year,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(courseClass, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create course class" },
      { status: 500 },
    );
  }
}
