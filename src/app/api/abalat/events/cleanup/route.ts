// /api/abalat/events/cleanup/route.ts - Delete events before today
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirm } = body;

    // Require explicit confirmation
    if (confirm !== "DELETE_ALL_OLD_EVENTS") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'DELETE_ALL_OLD_EVENTS' } to proceed." },
        { status: 400 }
      );
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count events that will be deleted
    const eventsToDelete = await prisma.event.count({
      where: {
        mode: 'ABALAT',
        date: {
          lt: today,
        },
      },
    });

    if (eventsToDelete === 0) {
      return NextResponse.json({
        message: "No old events found to delete",
        deletedCount: 0,
      });
    }

    // Delete events before today
    const result = await prisma.event.deleteMany({
      where: {
        mode: 'ABALAT',
        date: {
          lt: today,
        },
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${result.count} events before ${today.toISOString()}`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error("Cleanup events error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup events", details: error?.message },
      { status: 500 }
    );
  }
}

// GET to preview what would be deleted
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventsToDelete = await prisma.event.findMany({
      where: {
        mode: 'ABALAT',
        date: {
          lt: today,
        },
      },
      select: {
        id: true,
        title: true,
        date: true,
        mode: true,
      },
      orderBy: { date: 'desc' },
      take: 50, // Limit preview
    });

    const totalCount = await prisma.event.count({
      where: {
        mode: 'ABALAT',
        date: {
          lt: today,
        },
      },
    });

    return NextResponse.json({
      totalCount,
      preview: eventsToDelete,
      message: `Found ${totalCount} events before ${today.toISOString()}`,
    });
  } catch (error: any) {
    console.error("Preview cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to preview cleanup", details: error?.message },
      { status: 500 }
    );
  }
}
