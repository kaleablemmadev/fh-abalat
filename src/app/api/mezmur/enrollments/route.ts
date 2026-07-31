import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const enrollmentSchema = z.object({
  studentId: z.string().min(1),
  groupType: z.enum(["BEGINNERS", "CONTINUOUS"]),
  status: z.enum(["ACTIVE", "PENDING", "WITHDREW", "CANCELLED"]).optional(),
  enrolledDate: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupType = searchParams.get("groupType") as any;

    const enrollments = await prisma.mezmurEnrollment.findMany({
      where: groupType ? { groupType } : {},
      include: {
        student: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load enrollments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = enrollmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { studentId, groupType, status, enrolledDate } = validation.data;

    const enrollment = await prisma.mezmurEnrollment.upsert({
      where: {
        studentId_groupType: {
          studentId,
          groupType,
        },
      },
      update: {
        status: status || "ACTIVE",
        enrolledDate,
      },
      create: {
        studentId,
        groupType,
        status: status || "ACTIVE",
        enrolledDate,
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 });
  }
}
