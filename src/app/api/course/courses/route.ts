// /api/course/courses/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod schema for Course creation/update
const courseSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullish(),
  topics: z.array(z.string()).nullish(),
  credits: z.number().int().nullish(),
  requiredHours: z.number().int().min(0).optional(),
  instructorId: z.string().min(1),
  departmentId: z.string().min(1),
  isGiven: z.boolean().optional(),
  classTypes: z.array(z.enum(["KEDAMAY", "KALEAY", "SALSAY", "RABEAY", "KEREMT"])).min(1),
  semesterPreference: z.enum(["FIRST", "SECOND", "BOTH"]).optional(),
  teacherHandoutUrl: z.string().nullish(),
  studentHandoutUrl: z.string().nullish(),
  attendanceWeight: z.number().min(0).max(100).optional(),
  midExamWeight: z.number().min(0).max(100).optional(),
  assignmentWeight: z.number().min(0).max(100).optional(),
  finalExamWeight: z.number().min(0).max(100).optional(),
  courseClassIds: z.array(z.string()).optional(), // New field for many-to-many relationship
});

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: true,
        courseClasses: {
          include: {
            courseClass: true,
          },
        },
        courseYears: {
          include: {
            courseClass: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load courses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = courseSchema.safeParse(body);
    if (!validation.success) {
      console.error("Validation error:", validation.error.format());
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const {
      name, description, topics, credits, requiredHours, instructorId, departmentId, isGiven, classTypes,
      semesterPreference, teacherHandoutUrl, studentHandoutUrl,
      attendanceWeight, midExamWeight, assignmentWeight, finalExamWeight, courseClassIds
    } = validation.data;

    // Check if course name already exists
    const existing = await prisma.course.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Course "${name}" already exists` },
        { status: 409 },
      );
    }

    // Verify instructor exists
    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor not found" },
        { status: 404 },
      );
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 },
      );
    }

    const course = await prisma.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          name: name.trim(),
          description: description || null,
          topics: topics || [],
          credits: credits ?? null,
          requiredHours: requiredHours ?? 0,
          instructorId,
          departmentId,
          isGiven: isGiven ?? true,
          classTypes: classTypes,
          semesterPreference: semesterPreference || "FIRST",
          teacherHandoutUrl: teacherHandoutUrl || null,
          studentHandoutUrl: studentHandoutUrl || null,
          attendanceWeight: attendanceWeight ?? 10,
          midExamWeight: midExamWeight ?? 25,
          assignmentWeight: assignmentWeight ?? 15,
          finalExamWeight: finalExamWeight ?? 50,
          courseClasses: courseClassIds && courseClassIds.length > 0
            ? {
                create: courseClassIds.map(courseClassId => ({
                  courseClassId,
                })),
              }
            : undefined,
        },
      });

      // Automatically assign to all ACTIVE Academic Years that have matching classes
      const activeYears = await tx.academicYear.findMany({
        where: { isActive: true },
        include: { classes: true }
      });

      // Use the provided courseClassIds if available, otherwise use classTypes to find matching classes
      const targetClassIds = courseClassIds && courseClassIds.length > 0
        ? courseClassIds
        : activeYears.flatMap(year =>
            year.classes.filter(c => classTypes.includes(c.name as any)).map(c => c.id)
          );

      // Remove duplicates
      const uniqueClassIds = [...new Set(targetClassIds)];

      for (const year of activeYears) {
        for (const courseClassId of uniqueClassIds) {
          const cls = year.classes.find(c => c.id === courseClassId);
          if (!cls) continue;

          // Determine which semesters to create records for
          const targetSemesters: ("FIRST" | "SECOND")[] = [];
          if (newCourse.semesterPreference === "BOTH") {
            targetSemesters.push("FIRST", "SECOND");
          } else {
            targetSemesters.push(newCourse.semesterPreference as any);
          }

          for (const sem of targetSemesters) {
             // Determine dates from year
             const startDate = sem === "FIRST" ? (year.s1Start || year.startDate) : (year.s2Start || year.startDate);
             const endDate = sem === "FIRST" ? (year.s1End || year.endDate) : (year.s2End || year.endDate);

             await tx.courseYear.create({
              data: {
                courseId: newCourse.id,
                courseClassId: cls.id,
                year: year.year,
                semester: sem,
                startDate,
                endDate,
                attendanceWeight: newCourse.attendanceWeight,
                midExamWeight: newCourse.midExamWeight,
                assignmentWeight: newCourse.assignmentWeight,
                finalExamWeight: newCourse.finalExamWeight,
                isActive: true,
              }
            });
          }
        }
      }

      return newCourse;
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }
}
