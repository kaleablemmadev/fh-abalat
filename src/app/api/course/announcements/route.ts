import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const announcementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["GENERAL", "SCHEDULE", "URGENT"]),
  mode: z.enum(["ABALAT", "COURSE", "MEZMUR", "MEMBER"]).default("COURSE"),
  notifyStudents: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "COURSE";
    const isActive = searchParams.get("isActive") === "false" ? false : true;

    const announcements = await prisma.announcement.findMany({
      where: {
        mode: mode as any,
        isActive: isActive,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = announcementSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: {
          title: validated.title,
          message: validated.message,
          type: validated.type,
          mode: validated.mode,
        },
      });

      if (validated.notifyStudents) {
        // Find all students in this mode (or all if mode is MEMBER)
        const students = await tx.user.findMany({
          where: {
            type: "MEMBER",
            isActive: true,
            ...(validated.mode !== "MEMBER" ? { memberType: "COURSE_STUDENT" } : {}),
          },
          select: { id: true },
        });

        // Create notifications for each student
        if (students.length > 0) {
          await tx.notification.createMany({
            data: students.map((s) => ({
              title: validated.title,
              message: validated.message,
              type: "ANNOUNCEMENT",
              mode: validated.mode as any,
              targetUserId: s.id,
            })),
          });
        }
      }

      return announcement;
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Announcement creation error:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
