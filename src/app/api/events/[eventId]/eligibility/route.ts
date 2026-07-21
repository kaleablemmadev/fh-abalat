// src/app/api/events/[eventId]/eligibility/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EligibilityService } from "@/src/services/eligibility.service";
import prisma from "@/src/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    // If a specific rule is requested, use it
    if (ruleId) {
      const rule = await prisma.eligibilityRule.findUnique({
        where: { id: ruleId },
        include: {
          criteria: true,
        },
      });

      if (!rule) {
        return NextResponse.json(
          { error: "Eligibility rule not found" },
          { status: 404 }
        );
      }

      const report = await EligibilityService.checkEventEligibilityWithRule(eventId, rule);
      return NextResponse.json(report);
    }

    // Otherwise use the event's current rule
    const report = await EligibilityService.checkEventEligibility(eventId);
    return NextResponse.json(report);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check eligibility" },
      { status: 500 }
    );
  }
}