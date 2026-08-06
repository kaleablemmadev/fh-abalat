import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const academicYearSchema = z.object({
  year: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isActive: z.boolean().optional(),
  s1Start: z.string().optional(),
  s1End: z.string().optional(),
  s2Start: z.string().optional(),
  s2End: z.string().optional(),
  s1MidExamDate: z.string().optional(),
  s1FinalExamDate: z.string().optional(),
  s2MidExamDate: z.string().optional(),
  s2FinalExamDate: z.string().optional(),
  midExamMinAttendance: z.number().optional(),
  finalExamMinAttendance: z.number().optional(),
  includedClasses: z.array(z.string()).optional(),
  keremtDailyDuration: z.number().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = academicYearSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const {
      year, startDate, endDate, isActive,
      s1Start, s1End, s2Start, s2End,
      s1MidExamDate, s1FinalExamDate, s2MidExamDate, s2FinalExamDate,
      midExamMinAttendance, finalExamMinAttendance,
      includedClasses, keremtDailyDuration
    } = validation.data;

    // If setting to active, deactivate others
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.$transaction(async (tx) => {
      // Check if the new year name conflicts with another record
      const existingWithYear = await tx.academicYear.findFirst({
        where: { year, id: { not: id } }
      });

      if (existingWithYear) {
        throw new Error(`Another academic year with name ${year} already exists.`);
      }

      const updated = await tx.academicYear.update({
        where: { id },
        data: {
          year,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive ?? false,
          s1Start: s1Start ? new Date(s1Start) : null,
          s1End: s1End ? new Date(s1End) : null,
          s2Start: s2Start ? new Date(s2Start) : null,
          s2End: s2End ? new Date(s2End) : null,
          s1MidExamDate: s1MidExamDate ? new Date(s1MidExamDate) : null,
          s1FinalExamDate: s1FinalExamDate ? new Date(s1FinalExamDate) : null,
          s2MidExamDate: s2MidExamDate ? new Date(s2MidExamDate) : null,
          s2FinalExamDate: s2FinalExamDate ? new Date(s2FinalExamDate) : null,
          midExamMinAttendance: midExamMinAttendance ?? 5,
          finalExamMinAttendance: finalExamMinAttendance ?? 5,
        },
        include: {
          classes: true
        }
      });

      if (includedClasses) {
        // Ensure unique class types from input
        const uniqueIncludedClasses = [...new Set(includedClasses)];
        // Find existing classes to avoid duplicates
        const existingClassNames = updated.classes.map(c => c.name);
        const newClassTypes = uniqueIncludedClasses.filter(c => !existingClassNames.includes(c as any));

        if (newClassTypes.length > 0) {
          const courses = await tx.course.findMany({ where: { isGiven: true } });

          for (const type of newClassTypes) {
            const courseClass = await tx.courseClass.create({
              data: {
                name: type as any,
                year: updated.year,
                academicYearId: updated.id,
                isActive: true,
                startDate: updated.startDate,
                endDate: updated.endDate,
                dailyDurationHours: type === 'KEREMT' ? (keremtDailyDuration || 2.0) : 2.0,
              },
            });

            // Create CourseYear for each course assigned to this class type
            const classCourses = courses.filter(c => c.classTypes.includes(type as any));
            for (const course of classCourses) {
              const targetSemesters: ("FIRST" | "SECOND")[] = [];
              if (course.semesterPreference === "BOTH") {
                targetSemesters.push("FIRST", "SECOND");
              } else {
                targetSemesters.push(course.semesterPreference as any);
              }

              for (const sem of targetSemesters) {
                const sDate = sem === "FIRST" ? (updated.s1Start || updated.startDate) : (updated.s2Start || updated.startDate);
                const eDate = sem === "FIRST" ? (updated.s1End || updated.endDate) : (updated.s2End || updated.endDate);

                await tx.courseYear.create({
                  data: {
                    courseId: course.id,
                    courseClassId: courseClass.id,
                    year: updated.year,
                    semester: sem,
                    startDate: sDate,
                    endDate: eDate,
                    attendanceWeight: course.attendanceWeight,
                    midExamWeight: course.midExamWeight,
                    assignmentWeight: course.assignmentWeight,
                    finalExamWeight: course.finalExamWeight,
                    isActive: true,
                    instructorId: course.instructorId, // Requirement: assign instructor
                  }
                });
              }
            }
          }
        }
      }

      // If keremtDailyDuration is provided, update existing KEREMT class
      if (keremtDailyDuration !== undefined) {
          const keremtClass = updated.classes.find(c => c.name === 'KEREMT');
          if (keremtClass) {
              await tx.courseClass.update({
                  where: { id: keremtClass.id },
                  data: { dailyDurationHours: keremtDailyDuration }
              });
          }
      }

      return updated;
    }, {
      timeout: 30000
    });

    const finalResult = await prisma.academicYear.findUnique({
      where: { id: id },
      include: { classes: true }
    });

    return NextResponse.json(finalResult);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'record';
      return NextResponse.json(
        { error: `Unique constraint failed: A ${target} with these details already exists.` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update academic year" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if the academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: { classes: true }
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: "Academic year not found" },
        { status: 404 },
      );
    }

    // Prevent deletion if the year is active
    if (academicYear.isActive) {
      return NextResponse.json(
        { error: "Cannot delete active academic year. Please deactivate it first." },
        { status: 400 },
      );
    }

    // Check if there are any enrollments in this year
    const enrollmentCount = await prisma.courseEnrollment.count({
      where: {
        courseClass: {
          academicYearId: id
        }
      }
    });

    if (enrollmentCount > 0) {
      return NextResponse.json(
        {
          error: "STUDENTS_ENROLLED",
          message: `There are ${enrollmentCount} students enrolled in this academic year. Please transfer them to another year before deleting.`
        },
        { status: 400 }
      );
    }

    // Delete the academic year and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related CourseYear records
      await tx.courseYear.deleteMany({
        where: {
          courseClass: {
            academicYearId: id
          }
        }
      });

      // Delete related CourseClass records
      await tx.courseClass.deleteMany({
        where: { academicYearId: id }
      });

      // Delete the academic year
      await tx.academicYear.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete academic year" },
      { status: 500 },
    );
  }
}
