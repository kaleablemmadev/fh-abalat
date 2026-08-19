import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateAccessCode } from "@/src/lib/utils";
import { getEthiopianToday } from "@/src/lib/ethiopiancal";

const memberSchema = z.object({
  fullName: z.string().trim().min(1),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  age: z.number().int().min(1),
  christianName: z.string().optional().nullable(),
  registerDate: z.string().optional().nullable(),
});
const bulkSchema = z.object({ members: z.array(memberSchema).min(1) });
const deleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(request: NextRequest) {
  try {
    const result = bulkSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const yearDigits = getEthiopianToday().year.toString().slice(-2);
    const created = await prisma.$transaction(async (tx) => {
      const members = [];
      for (const member of result.data.members) {
        let privateId = generateAccessCode(yearDigits);
        for (let attempt = 0; attempt < 10 && await tx.user.findUnique({ where: { privateId } }); attempt++) {
          privateId = generateAccessCode(yearDigits);
        }
        members.push(await tx.user.create({ data: {
          fullName: member.fullName,
          gender: member.gender ?? "MALE",
          age: member.age,
          christianName: member.christianName ?? null,
          registerDate: member.registerDate ?? null,
          roles: { set: ["REGULAR_MEMBER"] },
          type: "MEMBER",
          privateId,
          mode: "ABALAT",
        } }));
      }
      return members;
    });
    return NextResponse.json({ createdCount: created.length, members: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to bulk create Abalat members", details: error?.message }, { status: error?.code === "P2002" ? 409 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = deleteSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    const ids = result.data.ids;
    const protectedMembers = await prisma.user.findMany({
      where: { id: { in: ids }, OR: [{ type: { not: "MEMBER" } }, { roles: { has: "COURSE_STUDENT" } }, { attendances: { some: {} } }, { permissions: { some: {} } }] },
      select: { id: true },
    });
    if (protectedMembers.length > 0) return NextResponse.json({ error: "Some members have course roles or related records and cannot be bulk deleted", ids: protectedMembers.map((member) => member.id) }, { status: 409 });
    const deleted = await prisma.user.deleteMany({ where: { id: { in: ids }, type: "MEMBER", mode: "ABALAT" } });
    return NextResponse.json({ deletedCount: deleted.count });
  } catch (error) {
    console.error("Bulk Abalat member deletion error:", error);
    return NextResponse.json({ error: "Failed to bulk delete members" }, { status: 500 });
  }
}
