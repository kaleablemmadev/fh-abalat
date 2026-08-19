import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  courseClassId: z.string().min(1),
  status: z.enum(["ACTIVE", "PENDING", "WITHDREW", "CANCELLED"]).optional(),
  enrolledDate: z.string().min(1),
  unenrollmentDate: z.string().optional().nullable(),
  unenrollmentReason: z.string().optional().nullable(),
});

const bulkSchema = z.object({ enrollments: z.array(enrollmentSchema).min(1) });
const deleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(request: NextRequest) {
  try {
    const result = bulkSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const keys = result.data.enrollments.map((item) => `${item.studentId}:${item.courseClassId}`);
    if (new Set(keys).size !== keys.length) return NextResponse.json({ error: "Duplicate enrollments in request" }, { status: 409 });

    const studentIds = [...new Set(result.data.enrollments.map((item) => item.studentId))];
    const classIds = [...new Set(result.data.enrollments.map((item) => item.courseClassId))];
    const [students, classes] = await prisma.$transaction([
      prisma.user.count({ where: { id: { in: studentIds }, type: "MEMBER" } }),
      prisma.courseClass.count({ where: { id: { in: classIds } } }),
    ]);
    if (students !== studentIds.length || classes !== classIds.length) {
      return NextResponse.json({ error: "One or more students or course classes do not exist" }, { status: 404 });
    }

    const created = await prisma.$transaction(
      result.data.enrollments.map((item) => prisma.courseEnrollment.create({ data: {
        studentId: item.studentId,
        courseClassId: item.courseClassId,
        status: item.status ?? "PENDING",
        enrolledDate: item.enrolledDate,
        unenrollmentDate: item.unenrollmentDate ? new Date(item.unenrollmentDate) : null,
        unenrollmentReason: item.unenrollmentReason ?? null,
      } }))
    );
    return NextResponse.json({ createdCount: created.length, enrollments: created }, { status: 201 });
  } catch (error: any) {
    const status = error?.code === "P2002" ? 409 : 500;
    return NextResponse.json({ error: "Failed to bulk create enrollments" }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = deleteSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    const deleted = await prisma.courseEnrollment.deleteMany({ where: { id: { in: result.data.ids } } });
    return NextResponse.json({ deletedCount: deleted.count });
  } catch (error) {
    console.error("Bulk enrollment deletion error:", error);
    return NextResponse.json({ error: "Failed to bulk delete enrollments" }, { status: 500 });
  }
}
