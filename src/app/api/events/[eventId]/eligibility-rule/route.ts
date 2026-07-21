// src/app/api/events/[eventId]/eligibility-rule/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { eligibilityRuleId } = body;

    // Validate
    if (!eligibilityRuleId) {
      return NextResponse.json(
        { error: "eligibilityRuleId is required" },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if rule exists
    const rule = await prisma.eligibilityRule.findUnique({
      where: { id: eligibilityRuleId },
    });

    if (!rule) {
      return NextResponse.json(
        { error: "Eligibility rule not found" },
        { status: 404 }
      );
    }

    // Update the event with the eligibility rule
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        eligibilityRuleId: eligibilityRuleId,
      },
      include: {
        eligibilityRule: {
          include: {
            criteria: true,
          },
        },
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("PUT /api/events/[eventId]/eligibility-rule error:", error);
    return NextResponse.json(
      { 
        error: "Failed to apply eligibility rule", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Remove the eligibility rule from the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        eligibilityRuleId: null,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("DELETE /api/events/[eventId]/eligibility-rule error:", error);
    return NextResponse.json(
      { 
        error: "Failed to remove eligibility rule", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}