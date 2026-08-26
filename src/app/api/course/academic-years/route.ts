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
  migrateStudents: z.record(z.string(), z.boolean()).optional(), // Map of class name to boolean for migration
});

export async function GET() {
  try {
    const years = await prisma.academicYear.findMany({
      include: {
        classes: true,
      },
      orderBy: { year: "desc" },
    });
    return NextResponse.json(years);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load academic years" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      includedClasses, keremtDailyDuration, migrateStudents
    } = validation.data;

    // Check if the year already exists
    const existingYear = await prisma.academicYear.findUnique({
      where: { year }
    });

    if (existingYear) {
      return NextResponse.json(
        { error: `Academic year ${year} already exists.` },
        { status: 400 }
      );
    }

    const completeYear = await prisma.$transaction(async (tx) => {
      // If setting to active, deactivate others
      if (isActive) {
        await tx.academicYear.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      const academicYear = await tx.academicYear.create({
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
      });

      // Automatically generate the constant classes if included
      const defaultClasses = ['KEDAMAY', 'KALEAY', 'SALSAY', 'RABEAY', 'KEREMT'];
      // Ensure class types are unique and valid
      const classTypes = [...new Set((includedClasses || defaultClasses).filter(c => defaultClasses.includes(c)))];

      // Check for previous year classes with students
      const migrationInfo: Record<string, { previousYear: string; studentCount: number; previousClassId: string }> = {};
      for (const type of classTypes) {
        const previousYearClass = await tx.courseClass.findFirst({
          where: {
            name: type as any,
            isActive: true,
          },
          orderBy: { year: 'desc' },
        });

        if (previousYearClass && previousYearClass.year !== academicYear.year) {
          const studentCount = await tx.courseEnrollment.count({
            where: {
              courseClassId: previousYearClass.id,
              status: 'ACTIVE',
            },
          });

          if (studentCount > 0) {
            migrationInfo[type] = {
              previousYear: previousYearClass.year,
              studentCount,
              previousClassId: previousYearClass.id,
            };
          }
        }
      }

      // Create classes AND CourseYear records for existing courses
      const courses = await tx.course.findMany({
        where: { isGiven: true }
      });

      const createdClasses: Record<string, string> = {};

      for (const type of classTypes) {
        const courseClass = await tx.courseClass.create({
          data: {
            name: type as any,
            year: academicYear.year,
            academicYearId: academicYear.id,
            isActive: true,
            startDate: academicYear.startDate,
            endDate: academicYear.endDate,
            dailyDurationHours: type === 'KEREMT' ? (keremtDailyDuration || 2.0) : 2.0,
          },
        });

        createdClasses[type] = courseClass.id;

        // If migration is requested for this class, migrate students
        if (migrateStudents?.[type] && migrationInfo[type]) {
          const previousEnrollments = await tx.courseEnrollment.findMany({
            where: {
              courseClassId: migrationInfo[type].previousClassId,
              status: 'ACTIVE',
            },
          });

          for (const enrollment of previousEnrollments) {
            // Create new enrollment for the new class
            await tx.courseEnrollment.create({
              data: {
                studentId: enrollment.studentId,
                courseClassId: courseClass.id,
                status: 'ACTIVE',
                enrolledDate: new Date().toISOString().split('T')[0],
              },
            });

            // Update user's current class reference
            await tx.user.update({
              where: { id: enrollment.studentId },
              data: { courseClassId: courseClass.id },
            });
          }
        }

        // Create CourseYear for each course assigned to this class type
        const classCourses = courses.filter(c => c.classTypes.includes(type as any));
        for (const course of classCourses) {
          // Determine which semesters to create records for
          const targetSemesters: ("FIRST" | "SECOND")[] = [];
          if (course.semesterPreference === "BOTH") {
            targetSemesters.push("FIRST", "SECOND");
          } else {
            targetSemesters.push(course.semesterPreference as any);
          }

          for (const sem of targetSemesters) {
            const startDate = sem === "FIRST" ? (academicYear.s1Start || academicYear.startDate) : (academicYear.s2Start || academicYear.startDate);
            const endDate = sem === "FIRST" ? (academicYear.s1End || academicYear.endDate) : (academicYear.s2End || academicYear.endDate);

            await tx.courseYear.create({
              data: {
                courseId: course.id,
                courseClassId: courseClass.id,
                year: academicYear.year,
                semester: sem,
                startDate,
                endDate,
                attendanceWeight: course.attendanceWeight,
                midExamWeight: course.midExamWeight,
                assignmentWeight: course.assignmentWeight,
                finalExamWeight: course.finalExamWeight,
                isActive: true,
                instructorId: course.instructorId, // Assign default instructor
              }
            });
          }
        }
      }

      const result = await tx.academicYear.findUnique({
        where: { id: academicYear.id },
        include: { classes: true }
      });

      return {
        ...result,
        migrationInfo,
      };
    }, {
      timeout: 30000 // Increase timeout for complex initialization
    });

    return NextResponse.json(completeYear, { status: 201 });
  } catch (error: any) {
    console.error("ACADEMIC_YEAR_POST_ERROR:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'record';
      return NextResponse.json(
        { error: `Unique constraint failed: A ${target} with these details already exists.` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create academic year" },
      { status: 400 },
    );
  }
}
