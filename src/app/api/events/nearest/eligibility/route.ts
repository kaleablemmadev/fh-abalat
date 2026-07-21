// src/app/api/events/nearest/eligibility/route.ts
import { NextResponse } from "next/server";
import { EligibilityService } from "@/src/services/eligibility.service";

export async function GET() {
  try {
    const report = await EligibilityService.getNearestEventEligibility();
    return NextResponse.json(report);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check nearest event eligibility" },
      { status: 500 }
    );
  }
}