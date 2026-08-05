import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isWithinAcademicYearTimeline } from "@/src/lib/utils";
import { CourseAttendanceService } from "@/src/services/course-attendance.service";

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

    // Validate record structure
    for (const record of records) {
      if (!record.memberId || !record.eventId) {
        return NextResponse.json(
          { error: "Each record must have memberId and eventId" },
          { status: 400 }
        );
      }
    }

    // Get the event to check academic year timeline and course-free days
    const eventId = records[0]?.eventId;
    if (eventId) {
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

      // Check if attendance can be marked for this event (course-free day check)
      const attendanceCheck = await CourseAttendanceService.canMarkAttendance(eventId);
      if (!attendanceCheck.canMark) {
        return NextResponse.json(
          { error: attendanceCheck.reason || "Cannot mark attendance for this event" },
          { status: 400 }
        );
      }
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
        chunk.map((record: { memberId: string; eventId: string; attendanceTypeId: string | null }) => {
          // If attendanceTypeId is null, delete the record
          if (record.attendanceTypeId === null) {
            return prisma.attendance.deleteMany({
              where: {
                memberId: record.memberId,
                eventId: record.eventId,
              },
            });
          }
          
          // Otherwise, upsert the record
          return prisma.attendance.upsert({
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
          });
        })
      );

      results.push(...chunkResults);
    }

    // Post-attendance processing: Update PENDING enrollments to ACTIVE
    // Only if the attendance value is >= 1 (Attended)
    const activeTypeIds = (await prisma.attendanceType.findMany({
      where: { value: { gte: 1 } },
      select: { id: true }
    })).map(t => t.id);

    const eventIds = Array.from(new Set(records.map(r => r.eventId)));

    // Find events to get their courseClassIds
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds }, courseClassId: { not: null } },
      select: { id: true, courseClassId: true }
    });

    const classIdMap = new Map(events.map(e => [e.id, e.courseClassId]));

    for (const record of records) {
      const courseClassId = classIdMap.get(record.eventId);
      const isAttended = activeTypeIds.includes(record.attendanceTypeId);

      if (courseClassId && isAttended) {
        await prisma.courseEnrollment.updateMany({
          where: {
            studentId: record.memberId,
            courseClassId: courseClassId,
            status: 'PENDING'
          },
          data: { status: 'ACTIVE' }
        });
      }
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
