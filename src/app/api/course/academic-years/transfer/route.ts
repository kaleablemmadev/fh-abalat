import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const transferSchema = z.object({
  fromYearId: z.string(),
  toYearId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromYearId, toYearId } = transferSchema.parse(body);

    if (fromYearId === toYearId) {
      return NextResponse.json(
        { error: "Source and target academic years must be different" },
        { status: 400 }
      );
    }

    const fromYear = await prisma.academicYear.findUnique({
      where: { id: fromYearId },
      include: { classes: true },
    });

    const toYear = await prisma.academicYear.findUnique({
      where: { id: toYearId },
      include: { classes: true },
    });

    if (!fromYear || !toYear) {
      return NextResponse.json(
        { error: "One or both academic years not found" },
        { status: 404 }
      );
    }

    // Validate that toYear has all the class types present in fromYear
    const fromClassNames = fromYear.classes.map((c) => c.name);
    const toClassNames = toYear.classes.map((c) => c.name);

    const missingClasses = fromClassNames.filter((name) => !toClassNames.includes(name));
    if (missingClasses.length > 0) {
      return NextResponse.json(
        {
          error: `The target year is missing matching classes for: ${missingClasses.join(
            ", "
          )}. Please initialize these classes in the target year first.`,
        },
        { status: 400 }
      );
    }

    // Perform the transfer in a transaction
    await prisma.$transaction(async (tx) => {
      for (const fromClass of fromYear.classes) {
        const toClass = toYear.classes.find((c) => c.name === fromClass.name)!;

        // 1. Move Enrollments
        await tx.courseEnrollment.updateMany({
          where: { courseClassId: fromClass.id },
          data: { courseClassId: toClass.id },
        });

        // 2. Move Events (Attendance history follows)
        await tx.event.updateMany({
          where: { courseClassId: fromClass.id },
          data: { courseClassId: toClass.id },
        });

        // 3. Move Marks
        // Marks are linked to CourseYear. We need to map each CourseYear in fromClass to its counterpart in toClass.
        const fromCourseYears = await tx.courseYear.findMany({
          where: { courseClassId: fromClass.id },
        });

        const toCourseYears = await tx.courseYear.findMany({
          where: { courseClassId: toClass.id },
        });

        for (const fromCY of fromCourseYears) {
          const toCY = toCourseYears.find(
            (cy) => cy.courseId === fromCY.courseId && cy.semester === fromCY.semester
          );

          if (toCY) {
            await tx.mark.updateMany({
              where: { courseYearId: fromCY.id },
              data: { courseYearId: toCY.id },
            });
          }
          // If no matching courseYear exists in target class, marks stay where they are (effectively orphaned or kept in old year context)
          // But usually, initializing a year creates all matching CourseYears.
        }

        // 4. Update Users current class reference
        await tx.user.updateMany({
          where: { courseClassId: fromClass.id },
          data: { courseClassId: toClass.id }
        });
      }
    }, {
        timeout: 60000 // Extended timeout for large data transfers
    });

    return NextResponse.json({ success: true, message: "Transfer completed successfully" });
  } catch (error) {
    console.error("Transfer error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to transfer academic year data" },
      { status: 500 }
    );
  }
}
