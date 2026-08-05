import { NextResponse } from "next/server";
import { CourseFreeDayService } from "@/src/services/course-free-day.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notifications = await CourseFreeDayService.sendNotifications(id);

    return NextResponse.json({
      success: true,
      notificationsSent: notifications.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
