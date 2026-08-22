/* /api/events/[eventId]/attendance/route.ts */
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createAuditLog } from "@/src/services/audit.service";
import { dateToEthiopian } from "@/src/lib/ethiopiancal";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findFirst({
      where: { id: eventId, mode: "ABALAT", courseClassId: null, eventType: { in: ["EVENT", "CHORE", "SUNDAY"] } },
      select: { courseClassId: true, eventType: true, isRecurring: true, title: true, date: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const attendances = await prisma.attendance.findMany({
      where: { eventId, mode: "ABALAT" },
      include: {
        member: true,
        attendanceType: true,
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load attendance" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();

    const event = await prisma.event.findFirst({
      where: { id: eventId, mode: "ABALAT", courseClassId: null, eventType: { in: ["EVENT", "CHORE", "SUNDAY"] } },
      select: { courseClassId: true, eventType: true, isRecurring: true, title: true, date: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Expected an array of attendance records" },
        { status: 400 }
      );
    }

    // For now, assume the first ADMIN is the one marking attendance
    // In a real app with auth, you'd get this from the session
    let adminUser = await prisma.user.findFirst({
      where: { type: "ADMIN", mode: "ABALAT" }
    });
    
    // Fallback if no admin exists
    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
          where: { type: "SUPERADMIN", mode: "ABALAT" }
      });
    }

    if (!adminUser) {
       return NextResponse.json(
        { error: "No admin user found to mark attendance" },
        { status: 400 }
      );
    }

    const memberIds = Array.from(new Set(body.map((record: { memberId: string }) => record.memberId)));
    const courseMembers = await prisma.user.findMany({
      where: {
        id: { in: memberIds },
        OR: [
          { type: { not: "MEMBER" } },
          { roles: { has: "COURSE_STUDENT" } },
        ],
      },
      select: { id: true },
    });

    if (courseMembers.length > 0) {
      return NextResponse.json(
        { error: "Course members cannot receive Abalat attendance" },
        { status: 403 }
      );
    }

    // Perform upsert for each record
    const before = await prisma.attendance.findMany({ where: { eventId, mode: "ABALAT" }, select: { memberId: true, attendanceTypeId: true } });
    await prisma.$transaction(
      body.map((record: { memberId: string; attendanceTypeId: string; permissionId?: string | null }) =>
        prisma.attendance.upsert({
          where: {
            memberId_eventId: {
              memberId: record.memberId,
              eventId: eventId,
            },
          },
          update: {
            attendanceTypeId: record.attendanceTypeId,
            permissionId: record.permissionId,
            markedById: adminUser.id,
          },
          create: {
            memberId: record.memberId,
            eventId: eventId,
            attendanceTypeId: record.attendanceTypeId,
            permissionId: record.permissionId,
            markedById: adminUser.id,
          },
        })
      )
    );

    await createAuditLog({
      action: "UPDATE",
      entityType: "ATTENDANCE",
      entityId: eventId,
      entityName: `${event.title} (${dateToEthiopian(event.date).month} ${dateToEthiopian(event.date).day})`,
      changes: { before, after: body, attendanceDate: event.date.toISOString() },
      mode: "ABALAT",
      performedById: adminUser.id,
    });

    return NextResponse.json({ message: "Attendance saved successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
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

    const event = await prisma.event.findFirst({
      where: { id: eventId, mode: "ABALAT", courseClassId: null, eventType: { in: ["EVENT", "CHORE", "SUNDAY"] } },
      select: { courseClassId: true, eventType: true, isRecurring: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    await prisma.attendance.deleteMany({
      where: { eventId },
    });

    return NextResponse.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
