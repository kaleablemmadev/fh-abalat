// /api/course/courses/[id]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const courseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  topics: z.array(z.string()).optional(),
  credits: z.number().int().optional(),
  instructorId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  isGiven: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: true,
        courseYears: {
          include: {
            courseClass: true,
            marks: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course" },
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
    const validation = courseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { name, description, topics, credits, instructorId, departmentId, isGiven } = validation.data;

    // Check if new name conflicts with existing
    if (name) {
      const existing = await prisma.course.findUnique({
        where: { name },
      });

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: `Course "${name}" already exists` },
          { status: 409 },
        );
      }
    }

    // Verify instructor exists if changing
    if (instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        return NextResponse.json(
          { error: "Instructor not found" },
          { status: 404 },
        );
      }
    }

    // Verify department exists if changing
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 },
        );
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(topics !== undefined && { topics }),
        ...(credits !== undefined && { credits }),
        ...(instructorId !== undefined && { instructorId }),
        ...(departmentId !== undefined && { departmentId }),
        ...(isGiven !== undefined && { isGiven }),
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update course" },
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
    const course = await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
