import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const instructorAttendanceSchema = z.object({
  id: z.string().optional(),
  instructorId: z.string().min(1),
  eventId: z.string().min(1),
  attendanceTypeId: z.string().min(1),
  durationHours: z.number().default(1.0),
  absenceReason: z.string().optional().nullable(),
  substituteForId: z.string().optional().nullable(),
  isBonus: z.boolean().default(false),
  courseId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const instructorId = searchParams.get("instructorId");
    const academicYearId = searchParams.get("academicYearId");

    const where: any = { mode: 'COURSE' };
    if (eventId) where.eventId = eventId;
    if (instructorId) where.instructorId = instructorId;
    if (academicYearId) {
      where.event = {
        courseClass: {
          academicYearId: academicYearId
        }
      };
    }

    const attendances = await prisma.instructorAttendance.findMany({
      where,
      include: {
        instructor: true,
        event: {
          include: {
            courseClass: true
          }
        },
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
    const records = Array.isArray(body) ? body : body.attendance;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Expected a non-empty array of attendance records" },
        { status: 400 }
      );
    }

    const validation = z.array(instructorAttendanceSchema).safeParse(records);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 }
      );
    }

    let adminUser = await prisma.user.findFirst({
      where: { type: { in: ["ADMIN", "SUPERADMIN"] }, mode: 'COURSE' }
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No authorized admin user found" },
        { status: 400 }
      );
    }

    // Process records
    const results = await prisma.$transaction(async (tx) => {
      const ops = [];
      for (const record of validation.data) {
        if (record.id) {
          // Update existing
          ops.push(tx.instructorAttendance.update({
            where: { id: record.id },
            data: {
              instructorId: record.instructorId,
              attendanceTypeId: record.attendanceTypeId,
              durationHours: record.durationHours,
              absenceReason: record.absenceReason,
              substituteForId: record.substituteForId,
              isBonus: record.isBonus,
              courseId: record.courseId,
              markedById: adminUser.id,
            }
          }));
        } else {
          // Since we removed unique constraint, we check if a similar record exists to avoid accidental duplicates
          // (same instructor, same event, same course)
          const existing = await tx.instructorAttendance.findFirst({
            where: {
              instructorId: record.instructorId,
              eventId: record.eventId,
              courseId: record.courseId,
            }
          });

          if (existing) {
            ops.push(tx.instructorAttendance.update({
              where: { id: existing.id },
              data: {
                attendanceTypeId: record.attendanceTypeId,
                durationHours: record.durationHours,
                absenceReason: record.absenceReason,
                substituteForId: record.substituteForId,
                isBonus: record.isBonus,
                markedById: adminUser.id,
              }
            }));
          } else {
            ops.push(tx.instructorAttendance.create({
              data: {
                instructorId: record.instructorId,
                eventId: record.eventId,
                attendanceTypeId: record.attendanceTypeId,
                durationHours: record.durationHours,
                absenceReason: record.absenceReason,
                substituteForId: record.substituteForId,
                isBonus: record.isBonus,
                courseId: record.courseId,
                markedById: adminUser.id,
                mode: 'COURSE'
              }
            }));
          }
        }
      }
      return Promise.all(ops);
    });

    return NextResponse.json(
      { message: `Instructor attendance saved successfully (${results.length} records)` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Instructor bulk save error:", error);
    return NextResponse.json(
      { error: "Failed to save instructor attendance", details: error?.message },
      { status: 500 }
    );
  }
}

