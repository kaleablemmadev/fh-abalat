import prisma from "@/src/lib/prisma";
import TodayDashboard from "./components/TodayDashboard";
import { FollowUpService } from "@/src/services/followup.service";
import { PerformanceService } from "@/src/services/performance.service";

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: { classes: true }
  });

  // Fetch events for today
  const todayEvents = await prisma.event.findMany({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd
      },
      isActive: true,
      mode: 'COURSE'
    },
    include: {
      courseClass: true,
      attendances: { take: 1 },
      instructorAttendances: { take: 1 }
    },
    orderBy: [
      // Prioritize unrecorded events (this is a simplified proxy: those without any attendance records yet)
      { createdAt: 'desc' }
    ]
  });

  // Sort events so those without attendance records come first
  const sortedEvents = [...todayEvents].sort((a, b) => {
    const aRecorded = (a.attendances.length > 0 || a.instructorAttendances.length > 0);
    const bRecorded = (b.attendances.length > 0 || b.instructorAttendances.length > 0);
    if (!aRecorded && bRecorded) return -1;
    if (aRecorded && !bRecorded) return 1;
    return 0;
  });

  const pendingFollowUps = await FollowUpService.getPendingFollowUps();

  const recentNotifications = await prisma.notification.findMany({
    where: {
      mode: 'COURSE',
      isRead: false
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Trigger milestone check whenever admin visits dashboard (throttled by service internal check)
  if (activeYear) {
    // We don't await this to keep the page load fast, it runs in the background
    PerformanceService.checkTeachingMilestones(activeYear.id).catch(console.error);
  }

  const initialData = {
    todayEvents: sortedEvents,
    pendingFollowUps,
    recentNotifications,
    activeYear
  };

  return <TodayDashboard initialData={initialData} />;
}
