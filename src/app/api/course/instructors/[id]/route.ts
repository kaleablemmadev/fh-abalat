// /api/course/instructors/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fullName, email, phoneNumber, departmentId } = body;

    if (!fullName || !departmentId) {
      return NextResponse.json({ error: "Full Name and Department are required" }, { status: 400 });
    }

    // Check for existing instructor with same name (excluding current)
    const existingName = await prisma.instructor.findFirst({
      where: {
        fullName: fullName.trim(),
        NOT: { id }
      }
    });

    if (existingName) {
      return NextResponse.json({ error: "An instructor with this name is already registered" }, { status: 409 });
    }

    // Check for existing instructor with same email if provided (excluding current)
    if (email) {
      const existingEmail = await prisma.instructor.findFirst({
        where: {
          email: email.trim(),
          NOT: { id }
        }
      });

      if (existingEmail) {
        return NextResponse.json({ error: "This email address is already in use by another instructor" }, { status: 409 });
      }
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data: {
        fullName: fullName.trim(),
        email: email ? email.trim() : null,
        phoneNumber,
        departmentId
      },
      include: { department: true }
    });

    return NextResponse.json(instructor);
  } catch (error: any) {
    console.error("Instructor update error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A unique constraint failed" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update instructor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check for course dependencies
    const courseCount = await prisma.course.count({
      where: { instructorId: id }
    });

    if (courseCount > 0) {
      return NextResponse.json({
        error: `Cannot delete instructor. They are currently assigned to ${courseCount} course(s).`
      }, { status: 409 });
    }

    await prisma.instructor.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Instructor deletion error:", error);
    return NextResponse.json({ error: "Failed to delete instructor" }, { status: 500 });
  }
}
