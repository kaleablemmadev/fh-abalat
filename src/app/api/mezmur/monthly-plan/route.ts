import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const monthPlanSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(13),
  dayPlans: z.array(z.object({
    day: z.number().int(),
    musicFileIds: z.array(z.string())
  }))
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get("year");
    const monthStr = searchParams.get("month");

    if (!yearStr || !monthStr) {
      return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
    }

    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const schedules = await prisma.monthlyMezmurSchedule.findMany({
      where: {
        year,
        month,
      },
      include: {
        musicFiles: true,
      },
      orderBy: { day: 'asc' }
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching monthly schedules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = monthPlanSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { year, month, dayPlans } = validation.data;

    // Use a transaction to update the schedules for this year/month safely
    await prisma.$transaction(async (tx) => {
      for (const dayPlan of dayPlans) {
        // Upsert the schedule for each day
        await tx.monthlyMezmurSchedule.upsert({
          where: {
            year_month_day: {
              year,
              month,
              day: dayPlan.day
            }
          },
          update: {
            musicFiles: {
              set: dayPlan.musicFileIds.map(id => ({ id }))
            }
          },
          create: {
            year,
            month,
            day: dayPlan.day,
            musicFiles: {
              connect: dayPlan.musicFileIds.map(id => ({ id }))
            }
          }
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating monthly schedule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
