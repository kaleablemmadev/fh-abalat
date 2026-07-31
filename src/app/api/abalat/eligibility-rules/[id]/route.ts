// src/app/api/eligibility-rules/[id]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await prisma.eligibilityRule.findUnique({
      where: { id },
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

    return NextResponse.json(rule);
  } catch (error) {
    console.error("GET /api/eligibility-rules/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to load eligibility rule" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, criteria } = body;

    // Validate
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json(
        { error: "At least one criterion is required" },
        { status: 400 }
      );
    }

    // Check if rule exists
    const existingRule = await prisma.eligibilityRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Eligibility rule not found" },
        { status: 404 }
      );
    }

    // Update using transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete existing criteria
      await tx.eligibilityCriteria.deleteMany({
        where: { eligibilityRuleId: id },
      });

      // 2. Update the rule
      const updatedRule = await tx.eligibilityRule.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description || null,
        },
      });

      // 3. Create new criteria
      for (const c of criteria) {
        await tx.eligibilityCriteria.create({
          data: {
            eligibilityRuleId: id,
            eventType: c.eventType || 'chore',
            minAttendances: c.minAttendances || 0,
            lookbackMonths: c.lookbackMonths || 1,
            isTotalAttendance: c.isTotalAttendance || false,
          },
        });
      }

      // 4. Return the updated rule with criteria
      return await tx.eligibilityRule.findUnique({
        where: { id },
        include: { criteria: true },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/eligibility-rules/[id] error:", error);
    return NextResponse.json(
      { 
        error: "Failed to update eligibility rule", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if rule exists
    const existingRule = await prisma.eligibilityRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Eligibility rule not found" },
        { status: 404 }
      );
    }

    // Delete using transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete criteria first
      await tx.eligibilityCriteria.deleteMany({
        where: { eligibilityRuleId: id },
      });

      // 2. Delete the rule
      await tx.eligibilityRule.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Eligibility rule deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/eligibility-rules/[id] error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete eligibility rule", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}