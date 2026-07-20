/* /api/events/[eventId/attendance/route.ts */
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Expected an array of attendance records" },
        { status: 400 }
      );
    }

    // For now, assume the first ADMIN is the one marking attendance
    // In a real app with auth, you'd get this from the session
    let adminUser = await prisma.user.findFirst({
      where: { type: "ADMIN" }
    });
    
    // Fallback if no admin exists
    if (!adminUser) {
      adminUser = await prisma.user.findFirst({
          where: { type: "SUPERADMIN" }
      });
    }

    if (!adminUser) {
       return NextResponse.json(
        { error: "No admin user found to mark attendance" },
        { status: 400 }
      );
    }

    // Perform upsert for each record
    await prisma.$transaction(
      body.map((record: { memberId: string; attendanceTypeId: string }) =>
        prisma.attendance.upsert({
          where: {
            memberId_eventId: {
              memberId: record.memberId,
              eventId: eventId,
            },
          },
          update: {
            attendanceTypeId: record.attendanceTypeId,
            markedById: adminUser.id,
          },
          create: {
            memberId: record.memberId,
            eventId: eventId,
            attendanceTypeId: record.attendanceTypeId,
            markedById: adminUser.id,
          },
        })
      )
    );

    return NextResponse.json({ message: "Attendance saved successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
