import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const [
      attendanceCount,
      studentCount,
      courseCount,
      instructorCount,
      enrollmentCount,
      departmentCount
    ] = await Promise.all([
      prisma.attendance.count({
        where: { event: { courseClassId: { not: null } } }
      }),
      prisma.user.count({
        where: { memberType: "COURSE_STUDENT", type: "MEMBER" }
      }),
      prisma.course.count(),
      prisma.instructor.count(),
      prisma.courseEnrollment.count({
        where: { status: "ACTIVE" }
      }),
      prisma.department.count()
    ]);

    return NextResponse.json({
      attendanceCount,
      studentCount,
      courseCount,
      instructorCount,
      enrollmentCount,
      departmentCount
    });
  } catch (error) {
    console.error("Course stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch course stats" },
      { status: 500 }
    );
  }
}
