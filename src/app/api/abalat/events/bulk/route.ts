import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  date: z.string().datetime(),
  location: z.string().optional().nullable(),
  ethiopianYear: z.number().int().optional().nullable(),
  ethiopianMonth: z.number().int().min(1).max(13).optional().nullable(),
  ethiopianDay: z.number().int().min(1).max(30).optional().nullable(),
  recurringMonth: z.number().int().min(1).max(13).optional().nullable(),
  recurringDay: z.number().int().min(1).max(30).optional().nullable(),
  eligibilityRuleId: z.string().optional().nullable(),
  targetRoles: z.array(z.enum(["COURSE_STUDENT", "REGULAR_MEMBER", "YOUTH_STUDENT"])).optional(),
});
const bulkSchema = z.object({ events: z.array(eventSchema).min(1) });
const deleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(request: NextRequest) {
  try {
    const result = bulkSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });

    const admin = await prisma.user.findFirst({ where: { type: "ADMIN" } })
      ?? await prisma.user.findFirst({ where: { type: "SUPERADMIN" } });
    if (!admin) return NextResponse.json({ error: "No admin user found" }, { status: 400 });

    const created = await prisma.$transaction(
      result.data.events.map((event) => prisma.event.create({ data: {
        title: event.title,
        description: event.description ?? null,
        date: new Date(event.date),
        location: event.location ?? null,
        ethiopianYear: event.ethiopianYear ?? null,
        ethiopianMonth: event.ethiopianMonth ?? null,
        ethiopianDay: event.ethiopianDay ?? null,
        isRecurring: true,
        recurringMonth: event.recurringMonth ?? event.ethiopianMonth ?? null,
        recurringDay: event.recurringDay ?? event.ethiopianDay ?? null,
        eligibilityRuleId: event.eligibilityRuleId ?? null,
        targetRoles: event.targetRoles ?? [],
        eventType: "EVENT",
        createdById: admin.id,
        courseClassId: null,
        mode: "ABALAT",
      } }))
    );
    return NextResponse.json({ createdCount: created.length, events: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to bulk create events", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = deleteSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    const ids = result.data.ids;
    const deleted = await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { eventId: { in: ids } } });
      return tx.event.deleteMany({ where: { id: { in: ids }, eventType: "EVENT", courseClassId: null, mode: "ABALAT" } });
    });
    return NextResponse.json({ deletedCount: deleted.count });
  } catch (error) {
    console.error("Bulk Abalat event deletion error:", error);
    return NextResponse.json({ error: "Failed to bulk delete events" }, { status: 500 });
  }
}
