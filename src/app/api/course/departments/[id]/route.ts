// /api/course/departments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Department Name is required" }, { status: 400 });
    }

    // Check for existing department with same name (excluding current)
    const existingName = await prisma.department.findFirst({
      where: {
        name: name.trim(),
        NOT: { id }
      }
    });

    if (existingName) {
      return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
    }

    // Check for existing department with same code if provided (excluding current)
    if (code) {
      const existingCode = await prisma.department.findFirst({
        where: {
          code: code.trim(),
          NOT: { id }
        }
      });

      if (existingCode) {
        return NextResponse.json({ error: "This department code is already assigned to another department" }, { status: 409 });
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code ? code.trim() : null,
        description
      }
    });

    return NextResponse.json(department);
  } catch (error: any) {
    console.error("Department update error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A unique constraint failed" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check for dependencies (instructors and courses)
    const instructorCount = await prisma.instructor.count({
      where: { departmentId: id }
    });

    const courseCount = await prisma.course.count({
      where: { departmentId: id }
    });

    if (instructorCount > 0 || courseCount > 0) {
      let dependencyMsg = "";
      if (instructorCount > 0) dependencyMsg += `${instructorCount} instructor(s)`;
      if (courseCount > 0) dependencyMsg += (dependencyMsg ? " and " : "") + `${courseCount} course(s)`;

      return NextResponse.json({
        error: `Cannot delete department. It has active ${dependencyMsg}.`
      }, { status: 409 });
    }

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Department deletion error:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
