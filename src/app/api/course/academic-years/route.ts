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
      includedClasses
    } = validation.data;

    // If setting to active, deactivate others
    if (isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
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
    const classTypes = (includedClasses || defaultClasses).filter(c => defaultClasses.includes(c));

    // Create classes AND CourseYear records for existing courses
    const courses = await prisma.course.findMany({
      where: { isGiven: true }
    });

    await Promise.all(
      classTypes.map(async (type) => {
        const courseClass = await prisma.courseClass.create({
          data: {
            name: type as any,
            year: academicYear.year,
            academicYearId: academicYear.id,
            isActive: true,
            startDate: academicYear.startDate,
            endDate: academicYear.endDate,
          },
        });

        // Create CourseYear for each course assigned to this class type
        const classCourses = courses.filter(c => c.classTypes.includes(type as any));
        await Promise.all(
          classCourses.map(course => {
            // Determine which semesters to create records for
            const targetSemesters: ("FIRST" | "SECOND")[] = [];
            if (course.semesterPreference === "BOTH") {
              targetSemesters.push("FIRST", "SECOND");
            } else {
              targetSemesters.push(course.semesterPreference as any);
            }

            return Promise.all(
              targetSemesters.map(sem => {
                const startDate = sem === "FIRST" ? (academicYear.s1Start || academicYear.startDate) : (academicYear.s2Start || academicYear.startDate);
                const endDate = sem === "FIRST" ? (academicYear.s1End || academicYear.endDate) : (academicYear.s2End || academicYear.endDate);

                return prisma.courseYear.create({
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
              })
            );
          })
        );
      })
    );

    const completeYear = await prisma.academicYear.findUnique({
      where: { id: academicYear.id },
      include: { classes: true }
    });

    return NextResponse.json(completeYear, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create academic year" },
      { status: 500 },
    );
  }
}
