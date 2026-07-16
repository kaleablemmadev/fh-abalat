import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Expected an array of attendance records" },
        { status: 400 }
      );
    }

    // For now, assume the first ADMIN is the one marking attendance
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
      body.map((record: { memberId: string; eventId: string; attendanceTypeId: string }) =>
        prisma.attendance.upsert({
          where: {
            memberId_eventId: {
              memberId: record.memberId,
              eventId: record.eventId,
            },
          },
          update: {
            attendanceTypeId: record.attendanceTypeId,
            markedById: adminUser.id,
          },
          create: {
            memberId: record.memberId,
            eventId: record.eventId,
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
      { error: "Failed to bulk save attendance" },
      { status: 500 }
    );
  }
}
