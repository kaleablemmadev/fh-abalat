// /api/events/[eventId]/eligibility/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EligibilityService } from "@/src/services/eligibility.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
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