// /src/app/api/attendance/bulk/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json(
        { error: "Expected a non-empty array of attendance records" },
        { status: 400 }
      );
    }

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
        { error: "No admin user found to mark attendance" },
        { status: 400 }
      );
    }

    // Process in chunks of 5 to avoid transaction timeout
    const CHUNK_SIZE = 5;
    const results = [];

    for (let i = 0; i < body.length; i += CHUNK_SIZE) {
      const chunk = body.slice(i, i + CHUNK_SIZE);
      
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
        ),
        {
          maxWait: 10000, // 10s max wait for connection
          timeout: 10000, // 10s per chunk
        }
      );
      
      results.push(...chunkResults);
    }

    return NextResponse.json(
      { message: `Attendance saved successfully (${results.length} records)` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Bulk save error:", error);
    return NextResponse.json(
      {
        error: "Failed to bulk save attendance",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}