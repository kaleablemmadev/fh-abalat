// /api/course/enrollments/[id]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const enrollmentSchema = z.object({
  status: z.enum(["ACTIVE", "PENDING", "WITHDREW", "CANCELLED"]).optional(),
  enrolledDate: z.string().min(1).optional(),
  unenrollmentDate: z.string().optional(),
  unenrollmentReason: z.string().optional(),
  finalGrade: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id },
      include: {
        student: true,
        courseClass: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load enrollment" },
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
    const validation = enrollmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { status, enrolledDate, unenrollmentDate, unenrollmentReason, finalGrade } = validation.data;

    const enrollment = await prisma.courseEnrollment.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(enrolledDate !== undefined && { enrolledDate }),
        ...(unenrollmentDate !== undefined && { unenrollmentDate: new Date(unenrollmentDate) }),
        ...(unenrollmentReason !== undefined && { unenrollmentReason }),
        ...(finalGrade !== undefined && { finalGrade }),
      },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
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
    const enrollment = await prisma.courseEnrollment.delete({
      where: { id },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 },
    );
  }
}
