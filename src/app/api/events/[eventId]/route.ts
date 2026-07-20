// /api/events/[eventId]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { dateToEthiopian } from "@/src/lib/ethiopiancal";

type EventUpdatePayload = Partial<{
  title: string;
  description: string;
  date: string;
  location: string;
  ethiopianYear: number;
  ethiopianMonth: number;
  ethiopianDay: number;
  eligibilityRuleId: string;
  targetMemberTypes: string[];
}>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const serialized = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      location: event.location,
      ethiopianYear: event.ethiopianYear,
      ethiopianMonth: event.ethiopianMonth,
      ethiopianDay: event.ethiopianDay,
      eligibilityRuleId: event.eligibilityRuleId,
      targetMemberTypes: event.targetMemberTypes,
      ethDate: dateToEthiopian(new Date(event.date)),
      _count: event._count,
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = (await request.json()) as EventUpdatePayload;

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updateData: any = { ...body };
    if (body.date) {
      updateData.date = new Date(body.date);
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update event" },
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
    
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Delete associated attendances first
    await prisma.attendance.deleteMany({
      where: { eventId },
    });

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
