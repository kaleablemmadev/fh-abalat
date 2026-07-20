// /api/eligibility-rules/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, criteria } = body;

    const rule = await prisma.eligibilityRule.create({
      data: {
        name,
        description,
        rules: {
          create: criteria.map((c: any) => ({
            eventType: c.eventType,
            minAttendances: c.minAttendances,
            lookbackMonths: c.lookbackMonths,
          }))
        }
      },
      include: {
        rules: true
      }
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create eligibility rule" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const rules = await prisma.eligibilityRule.findMany({
      include: {
        rules: true
      }
    });
    return NextResponse.json(rules);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load eligibility rules" },
      { status: 500 }
    );
  }
}