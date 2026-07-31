import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { gregorianToEthiopianDate } from "@/src/lib/ethiopiancal";

const eventSchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  eventType: z.enum(["MEZMUR_REGULAR", "MEZMUR_BEGINNERS", "MEZMUR_CONTINUOUS"]),
  description: z.string().optional(),
  location: z.string().optional(),
  createdById: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("type");

    const events = await prisma.event.findMany({
      where: {
        eventType: eventType ? (eventType as any) : { in: ["MEZMUR_REGULAR", "MEZMUR_BEGINNERS", "MEZMUR_CONTINUOUS"] },
        isActive: true,
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = eventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { title, date, eventType, description, location, createdById } = validation.data;
    const gregDate = new Date(date);
    const ethDate = gregorianToEthiopianDate({
      year: gregDate.getFullYear(),
      month: gregDate.getMonth() + 1,
      day: gregDate.getDate(),
    });

    const event = await prisma.event.create({
      data: {
        title,
        date: gregDate,
        eventType,
        description,
        location,
        createdById,
        ethiopianYear: ethDate.year,
        ethiopianMonth: ethDate.month,
        ethiopianDay: ethDate.day,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
