/* /api/events/route.ts */
import prisma from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        eligibilityRule: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    const serialized = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString(),
      eligibilityRule: event.eligibilityRule?.name ?? "",
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    );
  }
}