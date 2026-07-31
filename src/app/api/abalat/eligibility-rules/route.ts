// src/app/api/eligibility-rules/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const rules = await prisma.eligibilityRule.findMany({
      include: {
        criteria: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error("GET /api/eligibility-rules error:", error);
    return NextResponse.json(
      { error: "Failed to load eligibility rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Create the rule with criteria using nested writes
    const result = await prisma.eligibilityRule.create({
      data: {
        name: name.trim(),
        description: description || null,
        criteria: {
          create: criteria.map((c: any) => ({
            eventType: c.eventType || 'chore',
            minAttendances: c.minAttendances || 0,
            lookbackMonths: c.lookbackMonths || 1,
            isTotalAttendance: c.isTotalAttendance || false,
          })),
        },
      },
      include: {
        criteria: true,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/eligibility-rules error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create eligibility rule", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}