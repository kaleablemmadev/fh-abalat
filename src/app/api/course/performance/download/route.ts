import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { DocumentService } from "@/src/services/document.service";
import { courseClassTypeDisplayNames } from "@/src/app/course/constants/courseEnum";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseClassId = searchParams.get("courseClassId");

    if (!courseClassId) return NextResponse.json({ error: "Missing class ID" }, { status: 400 });

    const courseClass = await prisma.courseClass.findUnique({
      where: { id: courseClassId }
    });

    if (!courseClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    // Fetch performance data (Reuse logic from main performance API ideally, but for now...)
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseClassId },
      include: {
        student: {
          include: {
            marks: {
              include: {
                courseYear: { include: { course: true } }
              }
            }
          }
        }
      }
    });

    const courseYears = await prisma.courseYear.findMany({
      where: { courseClassId, isActive: true },
      include: { course: true }
    });

    const studentData = enrollments.map(en => {
      const student = en.student;
      const grades = courseYears.map(cy => {
        const mark = student.marks.find(m => m.courseYearId === cy.id);
        return mark?.computedScore || 0;
      });
      const total = grades.reduce((a, b) => a + b, 0);
      const average = courseYears.length > 0 ? total / courseYears.length : 0;

      return {
        fullName: student.fullName,
        grades,
        total,
        average,
        status: average >= 50 ? "PASSED" : "FAILED",
        rank: 0 // Will calculate next
      };
    });

    // Rank
    const ranked = studentData
      .sort((a, b) => b.average - a.average)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    const pdfBuffer = await DocumentService.generateCoursePerformancePDF({
      className: courseClassTypeDisplayNames[courseClass.name as keyof typeof courseClassTypeDisplayNames] || courseClass.name,
      year: courseClass.year,
      courses: courseYears.map(cy => ({ name: cy.course.name })),
      students: ranked
    });

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=performance-report-${courseClass.year}.pdf`,
      },
    });

  } catch (error) {
    console.error("PDF Download error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
