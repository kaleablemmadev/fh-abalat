// /api/course/courses/[id]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const courseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullish(),
  topics: z.array(z.string()).nullish(),
  credits: z.number().int().nullish(),
  instructorId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  isGiven: z.boolean().optional(),
  classTypes: z.array(z.enum(["KEDAMAY", "KALEAY", "SALSAY", "RABEAY", "KEREMT"])).optional(),
  semesterPreference: z.enum(["FIRST", "SECOND", "BOTH"]).optional(),
  teacherHandoutUrl: z.string().nullish(),
  studentHandoutUrl: z.string().nullish(),
  attendanceWeight: z.number().min(0).max(100).optional(),
  midExamWeight: z.number().min(0).max(100).optional(),
  assignmentWeight: z.number().min(0).max(100).optional(),
  finalExamWeight: z.number().min(0).max(100).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: true,
        courseYears: {
          include: {
            courseClass: true,
            marks: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load course" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate with Zod
    const validation = courseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 },
      );
    }

    const {
      name, description, topics, credits, instructorId, departmentId, isGiven, classTypes,
      semesterPreference, teacherHandoutUrl, studentHandoutUrl,
      attendanceWeight, midExamWeight, assignmentWeight, finalExamWeight
    } = validation.data;

    // Check if new name conflicts with existing
    if (name) {
      const existing = await prisma.course.findUnique({
        where: { name },
      });

      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: `Course "${name}" already exists` },
          { status: 409 },
        );
      }
    }

    // Verify instructor exists if changing
    if (instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        return NextResponse.json(
          { error: "Instructor not found" },
          { status: 404 },
        );
      }
    }

    // Verify department exists if changing
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Department not found" },
          { status: 404 },
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (topics !== undefined) updateData.topics = topics;
    if (credits !== undefined) updateData.credits = credits;
    if (instructorId !== undefined) updateData.instructorId = instructorId;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (isGiven !== undefined) updateData.isGiven = isGiven;
    if (classTypes !== undefined) updateData.classTypes = classTypes;
    if (semesterPreference !== undefined) updateData.semesterPreference = semesterPreference;
    if (teacherHandoutUrl !== undefined) updateData.teacherHandoutUrl = teacherHandoutUrl;
    if (studentHandoutUrl !== undefined) updateData.studentHandoutUrl = studentHandoutUrl;
    if (attendanceWeight !== undefined) updateData.attendanceWeight = attendanceWeight;
    if (midExamWeight !== undefined) updateData.midExamWeight = midExamWeight;
    if (assignmentWeight !== undefined) updateData.assignmentWeight = assignmentWeight;
    if (finalExamWeight !== undefined) updateData.finalExamWeight = finalExamWeight;

    const course = await prisma.$transaction(async (tx) => {
      const updatedCourse = await tx.course.update({
        where: { id },
        data: updateData,
      });

      // Sync weights and status to ALL CourseYears (past and present)
      await tx.courseYear.updateMany({
        where: { courseId: id },
        data: {
          attendanceWeight: updatedCourse.attendanceWeight,
          midExamWeight: updatedCourse.midExamWeight,
          assignmentWeight: updatedCourse.assignmentWeight,
          finalExamWeight: updatedCourse.finalExamWeight,
          isActive: updatedCourse.isGiven,
        }
      });

      // If classTypes changed, update CourseYears for the ACTIVE academic year
      if (classTypes !== undefined) {
        const activeYear = await tx.academicYear.findFirst({
          where: { isActive: true },
          include: { classes: true }
        });

        if (activeYear) {
          // Remove from classes no longer assigned (if no marks)
          const currentCourseYears = await tx.courseYear.findMany({
            where: {
              courseId: id,
              courseClassId: { in: activeYear.classes.map(c => c.id) }
            },
            include: { courseClass: true, _count: { select: { marks: true } } }
          });

          for (const cy of currentCourseYears) {
            if (!classTypes.includes(cy.courseClass.name as any)) {
               if (cy._count.marks === 0) {
                 await tx.courseYear.delete({ where: { id: cy.id } });
               } else {
                 await tx.courseYear.update({ where: { id: cy.id }, data: { isActive: false } });
               }
            }
          }

          // Add to new classes
          for (const type of classTypes) {
            const cls = activeYear.classes.find(c => c.name === type);
            if (cls) {
              await tx.courseYear.upsert({
                where: {
                  courseId_courseClassId_year: {
                    courseId: id,
                    courseClassId: cls.id,
                    year: activeYear.year
                  }
                },
                update: { isActive: true },
                create: {
                  courseId: id,
                  courseClassId: cls.id,
                  year: activeYear.year,
                  startDate: cls.startDate || activeYear.startDate,
                  endDate: cls.endDate || activeYear.endDate,
                  attendanceWeight: updatedCourse.attendanceWeight,
                  midExamWeight: updatedCourse.midExamWeight,
                  assignmentWeight: updatedCourse.assignmentWeight,
                  finalExamWeight: updatedCourse.finalExamWeight,
                  isActive: true,
                }
              });
            }
          }
        }
      }

      return updatedCourse;
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check for dependencies (CourseYears)
    const activeOfferings = await prisma.courseYear.count({
      where: { courseId: id }
    });

    if (activeOfferings > 0) {
      return NextResponse.json(
        { error: `Cannot delete course. It is assigned to ${activeOfferings} academic term(s).` },
        { status: 409 },
      );
    }

    const course = await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
