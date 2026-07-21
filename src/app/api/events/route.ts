// /src/app/api/events/route.ts
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
  isRecurring?: boolean;
  recurringMonth?: number | null;
  recurringDay?: number | null;
  eligibilityRuleId?: string;
  targetMemberTypes?: string[];
};

type EventTargetMemberTypes = "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        eventType: 'EVENT',
        OR: [
          { isRecurring: false },
          {
            isRecurring: true,
            ethiopianYear: new Date().getFullYear() - 8,
          }
        ]
      },
      include: {
        eligibilityRule: true,
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { date: "asc" },
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
      isRecurring: event.isRecurring,
      recurringMonth: event.recurringMonth,
      recurringDay: event.recurringDay,
      eligibilityRule: event.eligibilityRule?.name ?? "",
      eligibilityRuleId: event.eligibilityRuleId,
      targetMemberTypes: Array.isArray(event.targetMemberTypes)
        ? event.targetMemberTypes.map(t => String(t))
        : [],
      ethDate: dateToEthiopian(new Date(event.date)),
      _count: event._count,
    }));

    return NextResponse.json(serialized);
  } catch (error: any) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to load events", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    console.log("POST /api/events raw body:", rawBody);
    
    const body = JSON.parse(rawBody) as Partial<EventPayload>;
    console.log("POST /api/events parsed body:", JSON.stringify(body, null, 2));

    // Validation
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      return NextResponse.json(
        { error: "title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!body.date || typeof body.date !== 'string') {
      return NextResponse.json(
        { error: "date is required and must be a string" },
        { status: 400 }
      );
    }

    const eventDate = new Date(body.date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: `Invalid date format: "${body.date}"` },
        { status: 400 }
      );
    }

    // Get admin user
    let adminUser = await prisma.user.findFirst({ where: { type: "ADMIN" } });
    if (!adminUser) {
      adminUser = await prisma.user.findFirst({ where: { type: "SUPERADMIN" } });
    }

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found to create event" },
        { status: 400 }
      );
    }

    console.log("Admin user found:", adminUser.id);

    const targetMemberTypes = body.targetMemberTypes as EventTargetMemberTypes[] | undefined;

    // Build create data
    const createData: any = {
      title: body.title.trim(),
      description: body.description || null,
      date: eventDate,
      location: body.location || null,
      ethiopianYear: body.ethiopianYear ?? null,
      ethiopianMonth: body.ethiopianMonth ?? null,
      ethiopianDay: body.ethiopianDay ?? null,
      isRecurring: body.isRecurring === true,
      recurringMonth: body.isRecurring ? (body.recurringMonth ?? null) : null,
      recurringDay: body.isRecurring ? (body.recurringDay ?? null) : null,
      eligibilityRuleId: body.eligibilityRuleId || null,
      targetMemberTypes: targetMemberTypes || [],
      eventType: 'EVENT',
      createdById: adminUser.id,
    };

    console.log("Creating event with data:", JSON.stringify(createData, null, 2));

    const event = await prisma.event.create({ data: createData });

    console.log("Event created successfully:", event.id);
    return NextResponse.json(event, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/events error:", error);
    console.error("Error stack:", error?.stack);
    return NextResponse.json(
      { 
        error: "Failed to create event", 
        details: error?.message || "Unknown error",
        code: error?.code || "UNKNOWN"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.attendance.deleteMany({
        where: { eventId: { in: body.ids } },
      }),
      prisma.event.deleteMany({
        where: { 
          id: { in: body.ids },
          eventType: 'EVENT',
        },
      }),
    ]);

    return NextResponse.json(
      { message: `${body.ids.length} event(s) deleted successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to delete events", details: error?.message },
      { status: 500 }
    );
  }
}