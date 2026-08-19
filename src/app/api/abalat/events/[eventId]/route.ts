// /api/abalat/events/[eventId]/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { dateToEthiopian } from "@/src/lib/ethiopiancal";
import { isWithinAcademicYearTimeline } from "@/src/lib/utils";

type EventUpdatePayload = Partial<{
  title: string;
  description: string;
  date: string;
  location: string;
  ethiopianYear: number;
  ethiopianMonth: number;
  ethiopianDay: number;
  isRecurring: boolean;
  recurringMonth: number;
  recurringDay: number;
  eligibilityRuleId: string;
  targetRoles: string[];
}>;

type EventTargetMemberTypes = "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eligibilityRule: true,
      },
    });

    if (!event || event.courseClassId || event.eventType !== "EVENT" || !event.isRecurring) {
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
      isRecurring: event.isRecurring,
      recurringMonth: event.recurringMonth,
      recurringDay: event.recurringDay,
      eligibilityRule: event.eligibilityRule?.name ?? "",
      eligibilityRuleId: event.eligibilityRuleId,
      targetRoles: event.targetRoles,
      ethDate: dateToEthiopian(new Date(event.date)),
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

    const event = await prisma.event.findUnique({ 
      where: { id: eventId },
      include: {
        courseClass: {
          include: {
            academicYear: true
          }
        }
      }
    });
    if (!event || event.courseClassId || event.eventType !== "EVENT" || !event.isRecurring) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if current date is within academic year timeline for course-related events
    if (event.courseClass?.academicYear) {
      const { startDate, endDate } = event.courseClass.academicYear;
      
      if (!isWithinAcademicYearTimeline(new Date(startDate), new Date(endDate))) {
        return NextResponse.json(
          { error: "Cannot update course events outside the academic year timeline. Only registration and basic updates are allowed." },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      title?: string;
      description?: string | null;
      date?: Date;
      location?: string | null;
      ethiopianYear?: number | null;
      ethiopianMonth?: number | null;
      ethiopianDay?: number | null;
      isRecurring?: boolean;
      recurringMonth?: number | null;
      recurringDay?: number | null;
      eligibilityRuleId?: string | null;
      targetRoles?: EventTargetMemberTypes[];
    } = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date) updateData.date = new Date(body.date);
    if (body.location !== undefined) updateData.location = body.location;
    if (body.ethiopianYear !== undefined) updateData.ethiopianYear = body.ethiopianYear;
    if (body.ethiopianMonth !== undefined) updateData.ethiopianMonth = body.ethiopianMonth;
    if (body.ethiopianDay !== undefined) updateData.ethiopianDay = body.ethiopianDay;
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;
    if (body.recurringMonth !== undefined) updateData.recurringMonth = body.recurringMonth;
    if (body.recurringDay !== undefined) updateData.recurringDay = body.recurringDay;
    if (body.eligibilityRuleId !== undefined) updateData.eligibilityRuleId = body.eligibilityRuleId;
    if (body.targetRoles) {
      updateData.targetRoles = body.targetRoles as EventTargetMemberTypes[];
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
    if (!event || event.courseClassId || event.eventType !== "EVENT" || !event.isRecurring) {
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