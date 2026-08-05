import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const instructorAttendanceSchema = z.object({
  instructorId: z.string().min(1),
  eventId: z.string().min(1),
  attendanceTypeId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const instructorId = searchParams.get("instructorId");

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (instructorId) where.instructorId = instructorId;

    const attendances = await prisma.instructorAttendance.findMany({
      where,
      include: {
        instructor: true,
        event: true,
        attendanceType: true,
        markedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load instructor attendance" },
      { status: 500 }
    );
  }
}

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

    // Validate records
    const validation = z.array(instructorAttendanceSchema).safeParse(records);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
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
        chunk.map((record: { instructorId: string; eventId: string; attendanceTypeId: string }) =>
          prisma.instructorAttendance.upsert({
            where: {
              instructorId_eventId: {
                instructorId: record.instructorId,
                eventId: record.eventId,
              },
            },
            update: {
              attendanceTypeId: record.attendanceTypeId,
              markedById: adminUser.id,
            },
            create: {
              instructorId: record.instructorId,
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
      { message: `Instructor attendance saved successfully (${results.length} records)` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Instructor bulk save error:", error);
    return NextResponse.json(
      {
        error: "Failed to bulk save instructor attendance",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
