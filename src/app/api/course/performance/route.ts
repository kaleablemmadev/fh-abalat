import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { calculateFinalMark, getPassStatus, getLetterGrade } from "@/src/lib/courseGrading";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseClassId = searchParams.get("courseClassId");

    if (!courseClassId) {
      return NextResponse.json({ error: "courseClassId is required" }, { status: 400 });
    }

    // 1. Get all students in this class
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseClassId },
      include: {
        student: {
          include: {
            marks: {
              include: {
                courseYear: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // 2. Get all courses for this class to ensure we have a full matrix
    const courseYears = await prisma.courseYear.findMany({
      where: { courseClassId, isActive: true },
      include: { course: true }
    });

    // 3. Process each student
    const performanceData = enrollments.map(en => {
      const student = en.student;
      const studentMarks = student.marks || [];

      const courseGrades = courseYears.map(cy => {
        const mark = studentMarks.find(m => m.courseYearId === cy.id);
        return {
          courseId: cy.courseId,
          courseName: cy.course.name,
          score: mark?.computedScore || 0,
          letterGrade: mark?.letterGrade || "F",
          passStatus: mark?.passStatus || "FAILED",
          isGradingComplete: cy.isGradingComplete
        };
      });

      // Only count completed courses for the average
      const completedGrades = courseGrades.filter(g => g.isGradingComplete);
      const totalScore = courseGrades.reduce((sum, g) => sum + g.score, 0);
      const averageScore = completedGrades.length > 0
        ? completedGrades.reduce((sum, g) => sum + g.score, 0) / completedGrades.length
        : 0;

      return {
        studentId: student.id,
        fullName: student.fullName,
        privateId: student.privateId,
        courseGrades,
        averageScore,
        totalScore,
        overallPassStatus: averageScore >= 50 ? "PASSED" : "FAILED"
      };
    });

    // 4. Calculate Rankings
    const rankedData = performanceData
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    return NextResponse.json({
      courses: courseYears.map(cy => ({ id: cy.courseId, name: cy.course.name })),
      students: rankedData
    });

  } catch (error) {
    console.error("Performance API error:", error);
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 });
  }
}
