import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const instructorSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  departmentId: z.string().min(1),
});

const bulkSchema = z.object({ instructors: z.array(instructorSchema).min(1) });
const deleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(request: NextRequest) {
  try {
    const result = bulkSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const emails = result.data.instructors.flatMap((instructor) => instructor.email ? [instructor.email] : []);
    if (new Set(emails).size !== emails.length) {
      return NextResponse.json({ error: "Duplicate instructor emails in request" }, { status: 409 });
    }

    const created = await prisma.$transaction(
      result.data.instructors.map((instructor) => prisma.instructor.create({ data: instructor, include: { department: true } }))
    );
    return NextResponse.json({ createdCount: created.length, instructors: created }, { status: 201 });
  } catch (error: any) {
    const status = error?.code === "P2002" ? 409 : 500;
    return NextResponse.json({ error: "Failed to bulk create instructors" }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = deleteSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const dependencies = await prisma.instructor.findMany({
      where: { id: { in: result.data.ids }, courses: { some: {} } },
      select: { id: true },
    });
    if (dependencies.length > 0) {
      return NextResponse.json({ error: "Cannot delete instructors assigned to courses", ids: dependencies.map((item) => item.id) }, { status: 409 });
    }

    const deleted = await prisma.instructor.deleteMany({ where: { id: { in: result.data.ids } } });
    return NextResponse.json({ deletedCount: deleted.count });
  } catch (error) {
    console.error("Bulk instructor deletion error:", error);
    return NextResponse.json({ error: "Failed to bulk delete instructors" }, { status: 500 });
  }
}
