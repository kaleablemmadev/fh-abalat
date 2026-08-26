// /api/course/marks/shared/[token]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // For this implementation, we'll use the token as the courseYearId directly
    // In production, you'd want to:
    // 1. Create a ShareableLink model in the database
    // 2. Store the token with courseYearId, expiration, etc.
    // 3. Validate the token and check expiration
    // 4. Return the course data if valid

    // For now, we'll treat the token as courseYearId and load the data
    const courseYear = await prisma.courseYear.findUnique({
      where: { id: token },
      include: {
        course: {
          include: { instructor: true },
        },
        courseClass: true,
        instructor: true,
      },
    });

    if (!courseYear) {
      return NextResponse.json(
        { error: "Invalid link" },
        { status: 404 }
      );
    }

    // Get enrolled students for this course class
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseClassId: courseYear.courseClassId,
        status: "ACTIVE",
      },
      include: {
        student: true,
      },
      orderBy: { student: { fullName: "asc" } }
    });

    const students = enrollments.map(e => e.student);

    return NextResponse.json({
      courseInfo: {
        courseName: courseYear.course.name,
        className: courseYear.courseClass.name,
        year: courseYear.year,
        instructorName: courseYear.instructor?.fullName || courseYear.course.instructor.fullName,
      },
      students,
      weights: {
        attendanceWeight: courseYear.attendanceWeight,
        midExamWeight: courseYear.midExamWeight,
        assignmentWeight: courseYear.assignmentWeight,
        finalExamWeight: courseYear.finalExamWeight,
      },
    });
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { error: "Failed to validate link" },
      { status: 500 }
    );
  }
}
