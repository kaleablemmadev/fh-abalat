import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both direct array and { attendance: [...] } format
    const records = Array.isArray(body) ? body : body.attendance;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Expected a non-empty array of attendance records" },
        { status: 400 }
      );
    }

    let adminUser = await prisma.user.findFirst({
      where: { type: "ADMIN" }
    }) || await prisma.user.findFirst({
      where: { type: "SUPERADMIN" }
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found to mark attendance" },
        { status: 400 }
      );
    }

    // Process in chunks to avoid transaction timeout
    const CHUNK_SIZE = 10;
    const results = [];

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);

      const chunkResults = await prisma.$transaction(
        chunk.map((record: { memberId: string; eventId: string; attendanceTypeId: string }) =>
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

      results.push(...chunkResults);
    }

    return NextResponse.json(
      { message: `Attendance saved successfully (${results.length} records)` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Course bulk save error:", error);
    return NextResponse.json(
      {
        error: "Failed to bulk save attendance",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
