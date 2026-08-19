import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const permissionSchema = z.object({
  memberId: z.string().min(1),
  permissionTypeId: z.string().min(1),
  reason: z.string().optional().nullable(),
  ethiopianStartDate: z.string().optional().nullable(),
  ethiopianEndDate: z.string().optional().nullable(),
});
const bulkSchema = z.object({ permissions: z.array(permissionSchema).min(1) });
const deleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(request: NextRequest) {
  try {
    const result = bulkSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    const created = await prisma.$transaction(
      result.data.permissions.map((permission) => prisma.permission.create({ data: { ...permission, mode: "COURSE", status: "PENDING" } }))
    );
    return NextResponse.json({ createdCount: created.length, permissions: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to bulk create permissions", details: error?.message }, { status: error?.code === "P2002" ? 409 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = deleteSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    const ids = result.data.ids;
    const deleted = await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { permissionId: { in: ids } } });
      return tx.permission.deleteMany({ where: { id: { in: ids }, mode: "COURSE" } });
    });
    return NextResponse.json({ deletedCount: deleted.count });
  } catch (error) {
    console.error("Bulk permission deletion error:", error);
    return NextResponse.json({ error: "Failed to bulk delete permissions" }, { status: 500 });
  }
}
