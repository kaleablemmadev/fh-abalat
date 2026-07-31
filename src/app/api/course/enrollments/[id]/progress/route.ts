import prisma from "@/src/lib/prisma";
import { CourseProgressionService } from "@/src/services/course-progression.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { passStatus } = await request.json();

    if (!passStatus || !["PASSED", "FAILED"].includes(passStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update current enrollment
    const enrollment = await prisma.courseEnrollment.update({
      where: { id },
      data: { passStatus }
    });

    // If passed, trigger progression
    if (passStatus === "PASSED") {
      const result = await CourseProgressionService.progressStudent(enrollment.studentId, id);
      return NextResponse.json({ success: true, progression: result });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
