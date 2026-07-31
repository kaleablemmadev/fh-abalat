// /api/course/courses/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for Course creation/update
const courseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  topics: z.array(z.string()).optional(),
  credits: z.number().int().optional(),
  instructorId: z.string().min(1),
  departmentId: z.string().min(1),
});

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: true,
        courseYears: {
          include: {
            courseClass: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load courses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = courseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { name, description, topics, credits, instructorId, departmentId } = validation.data;

    // Check if course name already exists
    const existing = await prisma.course.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Course "${name}" already exists` },
        { status: 409 },
      );
    }

    // Verify instructor exists
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor not found" },
        { status: 404 },
      );
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    const course = await prisma.course.create({
      data: {
        name: name.trim(),
        description,
        topics: topics || [],
        credits,
        instructorId,
        departmentId,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }
}
