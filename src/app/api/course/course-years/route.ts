// /api/course/course-years/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeYearId = searchParams.get("activeYearId");

    const where: any = {};
    if (activeYearId) {
      where.academicYearId = activeYearId;
    }

    const courseYears = await prisma.courseYear.findMany({
      where,
      include: {
        course: {
          include: {
            instructor: true,
          },
        },
        courseClass: true,
        instructor: true,
      },
      orderBy: [
        { year: 'desc' },
        { course: { name: 'asc' } }
      ],
    });

    return NextResponse.json(courseYears);
  } catch (error) {
    console.error("Error fetching course years:", error);
    return NextResponse.json(
      { error: "Failed to fetch course years" },
      { status: 500 }
    );
  }
}
