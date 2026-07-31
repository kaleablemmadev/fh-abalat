// /api/course/members/bulk/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
});

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const result = BulkDeleteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { ids } = result.data;

  const deleted = await prisma.user.deleteMany({
    where: { id: { in: ids } },
  });

  return NextResponse.json({ deletedCount: deleted.count });
}