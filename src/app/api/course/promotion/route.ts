import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CourseEnrollmentService } from "@/src/services/course-enrollment.service";

const promotionSchema = z.object({
  studentIds: z.array(z.string()),
  sourceClassId: z.string(),
  targetClassId: z.string().optional(), // If not provided, it just marks them as 'ACTIVE' in current enrollment
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIds, sourceClassId, targetClassId } = promotionSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark current enrollments as ACTIVE (stays active for history)
      // Standard practice: if target is provided, maybe we should have a 'COMPLETED' status
      // but let's stick to the existing schema enum.
      await tx.courseEnrollment.updateMany({
        where: {
          studentId: { in: studentIds },
          courseClassId: sourceClassId,
        },
        data: {
          status: 'ACTIVE',
        }
      });

      if (targetClassId) {
        // 2. Create new enrollments for target class
        for (const id of studentIds) {
          await tx.courseEnrollment.upsert({
            where: {
              courseClassId_studentId: {
                studentId: id,
                courseClassId: targetClassId,
              }
            },
            update: { status: 'PENDING' },
            create: {
              studentId: id,
              courseClassId: targetClassId,
              status: 'PENDING',
              enrolledDate: new Date().toLocaleDateString(),
            }
          });

          // 3. AUTO-ENROLL in all courses for the new class
          await CourseEnrollmentService.autoEnrollInCourses(id, targetClassId, tx);
        }
      }

      return { count: studentIds.length };
    }, {
      timeout: 60000 // Promotion can involve many records
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Promotion API error:", error);
    return NextResponse.json({ error: "Failed to promote students" }, { status: 500 });
  }
}
