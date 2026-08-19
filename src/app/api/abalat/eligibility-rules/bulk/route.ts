import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const criterionSchema = z.object({
  eventType: z.string().optional(),
  minAttendances: z.number().int().nonnegative().optional(),
  lookbackMonths: z.number().int().positive().optional(),
  isTotalAttendance: z.boolean().optional(),
});
const ruleSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  criteria: z.array(criterionSchema).min(1),
});
const bulkSchema = z.object({ rules: z.array(ruleSchema).min(1) });
const deleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(request: NextRequest) {
  try {
    const result = bulkSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    const created = await prisma.$transaction(
      result.data.rules.map((rule) => prisma.eligibilityRule.create({
        data: {
          name: rule.name,
          description: rule.description ?? null,
          mode: "ABALAT",
          criteria: { create: rule.criteria.map((criterion) => ({
            eventType: criterion.eventType ?? "chore",
            minAttendances: criterion.minAttendances ?? 0,
            lookbackMonths: criterion.lookbackMonths ?? 1,
            isTotalAttendance: criterion.isTotalAttendance ?? false,
            mode: "ABALAT",
          })) },
        },
        include: { criteria: true },
      }))
    );
    return NextResponse.json({ createdCount: created.length, rules: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to bulk create eligibility rules", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = deleteSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    const ids = result.data.ids;
    const linkedEvents = await prisma.event.count({ where: { eligibilityRuleId: { in: ids } } });
    if (linkedEvents > 0) return NextResponse.json({ error: "Cannot delete rules linked to events" }, { status: 409 });
    const deleted = await prisma.$transaction(async (tx) => {
      await tx.eligibilityCriteria.deleteMany({ where: { ruleId: { in: ids }, mode: "ABALAT" } });
      return tx.eligibilityRule.deleteMany({ where: { id: { in: ids }, mode: "ABALAT" } });
    });
    return NextResponse.json({ deletedCount: deleted.count });
  } catch (error) {
    console.error("Bulk eligibility-rule deletion error:", error);
    return NextResponse.json({ error: "Failed to bulk delete eligibility rules" }, { status: 500 });
  }
}
