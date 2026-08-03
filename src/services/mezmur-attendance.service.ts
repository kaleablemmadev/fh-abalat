import prisma from "@/src/lib/prisma";
import {
  getEthiopianMonthDaysCount,
  ethMonthNames,
  ethiopianDateToDate,
  gregorianToEthiopianDate
} from "@/src/lib/ethiopiancal";

export class MezmurAttendanceService {
  /**
   * Create Sunday events for a specific Ethiopian month and year for MEZMUR_REGULAR
   */
  static async generateSundayEvents(ethYear: number, ethMonth: number, adminId: string) {
    const daysInMonth = getEthiopianMonthDaysCount(ethYear, ethMonth);
    const monthName = ethMonthNames[ethMonth];
    const generatedEvents = [];

    for (let day = 1; day <= daysInMonth; day++) {
      try {
        const ethDay = { year: ethYear, month: monthName, day };
        const gregDate = ethiopianDateToDate(ethDay);

        // Check if it's Sunday (day 0)
        if (gregDate.getDay() === 0) {
          // Check if event already exists for this date and type
          let event = await prisma.event.findFirst({
            where: {
              ethiopianYear: ethYear,
              ethiopianMonth: ethMonth,
              ethiopianDay: day,
              eventType: "MEZMUR_REGULAR",
            },
          });

          if (!event) {
            event = await prisma.event.create({
              data: {
                title: `Mezmur Regular - ${monthName} ${day}`,
                date: gregDate,
                ethiopianYear: ethYear,
                ethiopianMonth: ethMonth,
                ethiopianDay: day,
                eventType: "MEZMUR_REGULAR",
                createdById: adminId,
              },
            });
          }
          generatedEvents.push(event);
        }
      } catch (error) {
        console.error(`Error processing day ${day} for Mezmur Regular:`, error);
      }
    }
    return generatedEvents;
  }

  /**
   * Calculate attendance score for a member in Mezmur
   * Returns score out of 100 based on the events in the lookback period
   */
  static async calculateMezmurScore(memberId: string, lookbackMonths: number, targetDate: Date) {
    const cutoffDate = new Date(targetDate);
    cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

    const attendances = await prisma.attendance.findMany({
      where: {
        memberId,
        event: {
          date: { gte: cutoffDate, lt: targetDate },
          eventType: { in: ["MEZMUR_REGULAR", "MEZMUR_BEGINNERS", "MEZMUR_CONTINUOUS"] },
        },
      },
      include: {
        attendanceType: true,
      },
    });

    const totalWeight = attendances.reduce((acc, curr) => acc + (curr.attendanceType?.value || 0), 0);

    // Count total Mezmur attendance events in the same period (excluding custom MEZMUR_EVENT)
    const totalEvents = await prisma.event.count({
        where: {
            date: { gte: cutoffDate, lt: targetDate },
            eventType: { in: ["MEZMUR_REGULAR", "MEZMUR_BEGINNERS", "MEZMUR_CONTINUOUS"] },
        }
    });

    if (totalEvents === 0) return 100;
    const score = (totalWeight / totalEvents) * 100;
    return Math.min(Math.max(score, 0), 100);
  }
}
