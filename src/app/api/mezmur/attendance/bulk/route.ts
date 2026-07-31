import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bulkAttendanceSchema = z.object({
  attendance: z.array(z.object({
    memberId: z.string(),
    eventId: z.string(),
    attendanceTypeId: z.string(),
    markedById: z.string(),
    note: z.string().optional(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = bulkAttendanceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { attendance } = validation.data;

    const result = await prisma.$transaction(
      attendance.map((record) =>
        prisma.attendance.upsert({
          where: {
            memberId_eventId: {
              memberId: record.memberId,
              eventId: record.eventId,
            },
          },
          update: {
            attendanceTypeId: record.attendanceTypeId,
            markedById: record.markedById,
            note: record.note,
          },
          create: {
            memberId: record.memberId,
            eventId: record.eventId,
            attendanceTypeId: record.attendanceTypeId,
            markedById: record.markedById,
            note: record.note,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
