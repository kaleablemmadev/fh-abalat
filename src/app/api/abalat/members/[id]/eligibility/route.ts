import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { EligibilityService } from "@/src/services/eligibility.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const member = await prisma.user.findFirst({
      where: {
        id,
        type: "MEMBER",
        NOT: { roles: { has: "COURSE_STUDENT" } },
      },
      select: { id: true, roles: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        mode: "ABALAT",
        eventType: "EVENT",
        courseClassId: null,
        isRecurring: true,
        isActive: true,
        date: { gte: now },
        eligibilityRuleId: { not: null },
        targetRoles: { hasSome: member.roles },
      },
      include: {
        eligibilityRule: { include: { criteria: true } },
      },
      orderBy: { date: "asc" },
    });

    const summaries = [];
    for (const event of events) {
      if (!event.eligibilityRule) continue;
      const result = await EligibilityService.checkMemberEligibility(
        member.id,
        event.eligibilityRule.criteria.map((criterion) => ({
          eventType: criterion.eventType,
          minAttendances: criterion.minAttendances,
          lookbackMonths: criterion.lookbackMonths,
          isTotalAttendance: criterion.isTotalAttendance,
        })),
        event.date,
        undefined,
        event.eventType === "CHORE" || event.eventType === "SUNDAY" || event.eventType === "EVENT"
          ? event.eventType
          : "EVENT",
      );
      summaries.push({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        ruleName: event.eligibilityRule.name,
        ...result,
      });
    }

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Abalat member eligibility error:", error);
    return NextResponse.json(
      { error: "Failed to load member eligibility" },
      { status: 500 },
    );
  }
}
