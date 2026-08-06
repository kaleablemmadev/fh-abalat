import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { FollowUpService } from "@/src/services/followup.service";

export async function GET() {
  try {
    const followUps = await FollowUpService.getPendingFollowUps();
    return NextResponse.json(followUps);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status, notes } = await request.json();
    const updated = await FollowUpService.resolveFollowUp(id, status, notes);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
  }
}
