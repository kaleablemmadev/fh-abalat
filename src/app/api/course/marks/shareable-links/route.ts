// /api/course/marks/shareable-links/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

const linkSchema = {
  courseYearId: "string",
  expiresAt: "string",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseYearId, expiresAt } = body;

    if (!courseYearId) {
      return NextResponse.json(
        { error: "courseYearId is required" },
        { status: 400 }
      );
    }

    // Verify course year exists
    const courseYear = await prisma.courseYear.findUnique({
      where: { id: courseYearId },
      include: {
        course: {
          include: { instructor: true },
        },
        courseClass: true,
      },
    });

    if (!courseYear) {
      return NextResponse.json(
        { error: "Course year not found" },
        { status: 404 }
      );
    }

    // Generate unique token
    const token = nanoid(16);

    // Calculate expiration date (default 7 days from now if not provided)
    const expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create shareable link record (we'll use a simple approach with a JSON field or create a new model)
    // For now, we'll store it in a simple way - you may want to create a proper model later
    const shareableLink = {
      token,
      courseYearId,
      courseName: courseYear.course.name,
      className: courseYear.courseClass.name,
      year: courseYear.year,
      instructorName: courseYear.instructor?.fullName || courseYear.course.instructor.fullName,
      expiresAt: expirationDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    // For simplicity, we'll return the token and the full URL
    // In production, you'd want to store this in the database
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const shareableUrl = `${baseUrl}/course/marks/shared/${token}`;

    return NextResponse.json({
      token,
      shareableUrl,
      expiresAt: expirationDate.toISOString(),
      courseInfo: {
        courseName: courseYear.course.name,
        className: courseYear.courseClass.name,
        year: courseYear.year,
        instructorName: courseYear.instructor?.fullName || courseYear.course.instructor.fullName,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating shareable link:", error);
    return NextResponse.json(
      { error: "Failed to create shareable link" },
      { status: 500 }
    );
  }
}
