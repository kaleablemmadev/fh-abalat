import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.courseYear.update({
      where: { id },
      data: {
        ...(body.isGradingComplete !== undefined && { isGradingComplete: body.isGradingComplete }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.instructorId !== undefined && { instructorId: body.instructorId || null }),
      },
      include: {
        instructor: true,
        course: true,
        courseClass: true
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("CourseYear PATCH error:", error);
    return NextResponse.json({ error: "Failed to update course term" }, { status: 500 });
  }
}
