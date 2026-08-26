// /api/course/course-classes/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for CourseClass creation/update
const courseClassSchema = z.object({
  name: z.enum(["KEDAMAY", "KALEAY", "SALSAY", "RABEAY", "KEREMT"]),
  year: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  migrateStudents: z.boolean().optional(), // If true, migrate students from previous year's class
});

export async function GET() {
  try {
    const courseClasses = await prisma.courseClass.findMany({
      where: { isActive: true },
      include: {
        courseYears: {
          include: {
            course: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { name: "asc" }],
    });
    return NextResponse.json(courseClasses);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course classes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = courseClassSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { name, year, startDate, endDate, migrateStudents } = validation.data;

    // Check if class already exists for this year
    const existing = await prisma.courseClass.findUnique({
      where: {
        name_year: {
          name,
          year,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Course class ${name} already exists for year ${year}` },
        { status: 409 },
      );
    }

    // Check if there's a previous year's class with the same name that has students
    const previousYearClass = await prisma.courseClass.findFirst({
      where: {
        name,
        isActive: true,
      },
      orderBy: { year: 'desc' },
    });

    let migrationInfo = null;
    if (previousYearClass && previousYearClass.year !== year) {
      const studentCount = await prisma.courseEnrollment.count({
        where: {
          courseClassId: previousYearClass.id,
          status: 'ACTIVE',
        },
      });

      if (studentCount > 0) {
        migrationInfo = {
          hasPreviousStudents: true,
          previousYear: previousYearClass.year,
          studentCount,
          previousClassId: previousYearClass.id,
        };
      }
    }

    const courseClass = await prisma.$transaction(async (tx) => {
      const newClass = await tx.courseClass.create({
        data: {
          name,
          year,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      // If migrateStudents is true and there are previous students, migrate them
      if (migrateStudents && migrationInfo && migrationInfo.previousClassId) {
        const previousEnrollments = await tx.courseEnrollment.findMany({
          where: {
            courseClassId: migrationInfo.previousClassId,
            status: 'ACTIVE',
          },
        });

        for (const enrollment of previousEnrollments) {
          // Create new enrollment for the new class
          await tx.courseEnrollment.create({
            data: {
              studentId: enrollment.studentId,
              courseClassId: newClass.id,
              status: 'ACTIVE',
              enrolledDate: new Date().toISOString().split('T')[0],
            },
          });

          // Update user's current class reference
          await tx.user.update({
            where: { id: enrollment.studentId },
            data: { courseClassId: newClass.id },
          });
        }
      }

      return newClass;
    });

    return NextResponse.json({
      ...courseClass,
      migrationInfo,
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create course class" },
      { status: 500 },
    );
  }
}
