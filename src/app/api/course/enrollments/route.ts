// /api/course/enrollments/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for ClassEnrollment creation/update
const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseClassId: z.string().min(1),
  status: z.enum(["ACTIVE", "PENDING", "WITHDREW", "CANCELLED"]).optional(),
  enrolledDate: z.string().min(1),
  unenrollmentDate: z.string().optional(),
  unenrollmentReason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseClassId = searchParams.get("courseClassId");
    const studentId = searchParams.get("studentId");

    const where: any = {};
    if (courseClassId) where.courseClassId = courseClassId;
    if (studentId) where.studentId = studentId;

    const enrollments = await prisma.courseEnrollment.findMany({
      where,
      include: {
        student: true,
        courseClass: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load enrollments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = enrollmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { studentId, courseClassId, status, enrolledDate, unenrollmentDate, unenrollmentReason } = validation.data;

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 },
      );
    }

    // Verify course class exists
    const courseClass = await prisma.courseClass.findUnique({
      where: { id: courseClassId },
    });

    if (!courseClass) {
      return NextResponse.json(
        { error: "Course class not found" },
        { status: 404 },
      );
    }

    // Check if enrollment already exists
    const existing = await prisma.courseEnrollment.findUnique({
      where: {
        courseClassId_studentId: {
          courseClassId,
          studentId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Student already enrolled in this class" },
        { status: 409 },
      );
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        studentId,
        courseClassId,
        status: status || "PENDING",
        enrolledDate,
        unenrollmentDate: unenrollmentDate ? new Date(unenrollmentDate) : null,
        unenrollmentReason,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 },
    );
  }
}
