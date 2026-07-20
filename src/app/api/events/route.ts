// /api/events/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { dateToEthiopian } from "@/src/lib/ethiopiancal";

type EventPayload = {
  title: string;
  description?: string;
  date: string;
  location?: string;
  ethiopianYear?: number;
  ethiopianMonth?: number;
  ethiopianDay?: number;
  eligibilityRuleId?: string;
  targetMemberTypes?: string[];
};

type EventTargetMemberTypes = "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        eligibilityRule: true,
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const serialized = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      location: event.location,
      ethiopianYear: event.ethiopianYear,
      ethiopianMonth: event.ethiopianMonth,
      ethiopianDay: event.ethiopianDay,
      eligibilityRule: event.eligibilityRule?.name ?? "",
      eligibilityRuleId: event.eligibilityRuleId,
      targetMemberTypes: event.targetMemberTypes,
      ethDate: dateToEthiopian(new Date(event.date)),
      _count: event._count,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<EventPayload>;

    if (!body.title || !body.date) {
      return NextResponse.json(
        { error: "title and date are required" },
        { status: 400 }
      );
    }

    // Get admin user for createdById
    let adminUser = await prisma.user.findFirst({
      where: { type: "ADMIN" }
    });
    
    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
        where: { type: "SUPERADMIN" }
      });
    }

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found to create event" },
        { status: 400 }
      );
    }

    const targetMemberTypes = body.targetMemberTypes as EventTargetMemberTypes[] | undefined;

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        date: new Date(body.date),
        location: body.location,
        ethiopianYear: body.ethiopianYear,
        ethiopianMonth: body.ethiopianMonth,
        ethiopianDay: body.ethiopianDay,
        eligibilityRuleId: body.eligibilityRuleId,
        targetMemberTypes: targetMemberTypes || [],
        createdById: adminUser.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}