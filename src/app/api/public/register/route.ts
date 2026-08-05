import prisma from "@/src/lib/prisma";
import { z } from 'zod';
import { NextResponse, NextRequest } from "next/server";
import { genderType } from "@/src/generated/prisma";
import { generateCourseStudentCode } from "@/src/lib/utils";
import { CourseEnrollmentService } from "@/src/services/course-enrollment.service";

const registerSchema = z.object({
  fullName: z.string().min(2),
  gender: z.nativeEnum(genderType),
  age: z.number().min(5),
  phoneNumber: z.string().min(9),
  address: z.string().min(3),
  courseClassId: z.string().min(1, "Course Class is required")
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Generate a unique privateId FHC-XXXX
    let privateId = generateCourseStudentCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { privateId },
      });
      if (!existing) {
        isUnique = true;
      } else {
        privateId = generateCourseStudentCode();
        attempts++;
      }
    }

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: validatedData.fullName,
          gender: validatedData.gender,
          age: validatedData.age,
          phoneNumber: validatedData.phoneNumber,
          address: validatedData.address,
          memberType: "COURSE_STUDENT",
          type: "MEMBER",
          privateId,
          enrollments: {
            create: {
              courseClassId: validatedData.courseClassId,
              enrolledDate: new Date().toLocaleDateString(),
              status: "PENDING"
            }
          }
        },
        include: {
          enrollments: {
            include: { courseClass: true }
          }
        }
      });

      await CourseEnrollmentService.autoEnrollInCourses(user.id, validatedData.courseClassId, tx);
      return user;
    }, {
      timeout: 30000
    });

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        fullName: student.fullName,
        privateId: student.privateId,
        className: student.enrollments[0]?.courseClass?.name,
        classYear: student.enrollments[0]?.courseClass?.year
      }
    });
  } catch (error) {
    console.error("Public registration error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to register. Please try again." }, { status: 500 });
  }
}
