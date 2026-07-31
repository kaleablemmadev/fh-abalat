// /api/course/course-classes/[id]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const courseClassSchema = z.object({
  name: z.enum(["KEDAMAY", "KALEAY", "SALSAY", "RABEAY", "KEREMT"]).optional(),
  year: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseClass = await prisma.courseClass.findUnique({
      where: { id },
      include: {
        courseYears: {
          include: {
            course: true,
            marks: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!courseClass) {
      return NextResponse.json(
        { error: "Course class not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(courseClass);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course class" },
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
    const validation = courseClassSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { name, year, startDate, endDate, isActive } = validation.data;

    // Check if new name/year combination conflicts with existing
    if (name && year) {
      const existing = await prisma.courseClass.findUnique({
        where: {
          name_year: {
            name,
            year,
          },
        },
      });

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: `Course class ${name} already exists for year ${year}` },
          { status: 409 },
        );
      }
    }

    const courseClass = await prisma.courseClass.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(year !== undefined && { year }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(courseClass);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update course class" },
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
    const courseClass = await prisma.courseClass.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(courseClass);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete course class" },
      { status: 500 },
    );
  }
}
