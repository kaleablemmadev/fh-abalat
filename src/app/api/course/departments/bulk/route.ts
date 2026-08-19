import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1).optional(),
  description: z.string().optional().nullable(),
});

const bulkSchema = z.object({
  departments: z.array(departmentSchema).min(1),
});

const deleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const result = bulkSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const names = result.data.departments.map((department) => department.name);
    const codes = result.data.departments.flatMap((department) => department.code ? [department.code] : []);
    if (new Set(names).size !== names.length || new Set(codes).size !== codes.length) {
      return NextResponse.json({ error: "Duplicate department names or codes in request" }, { status: 409 });
    }

    const created = await prisma.$transaction(
      result.data.departments.map((department) => prisma.department.create({ data: department }))
    );
    return NextResponse.json({ createdCount: created.length, departments: created }, { status: 201 });
  } catch (error: any) {
    const status = error?.code === "P2002" ? 409 : 500;
    return NextResponse.json({ error: "Failed to bulk create departments" }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = deleteSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const dependencies = await prisma.department.findMany({
      where: { id: { in: result.data.ids }, OR: [{ courses: { some: {} } }, { instructors: { some: {} } }] },
      select: { id: true },
    });
    if (dependencies.length > 0) {
      return NextResponse.json({ error: "Cannot delete departments with courses or instructors", ids: dependencies.map((item) => item.id) }, { status: 409 });
    }

    const deleted = await prisma.department.deleteMany({ where: { id: { in: result.data.ids } } });
    return NextResponse.json({ deletedCount: deleted.count });
  } catch (error) {
    console.error("Bulk department deletion error:", error);
    return NextResponse.json({ error: "Failed to bulk delete departments" }, { status: 500 });
  }
}
