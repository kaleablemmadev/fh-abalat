// /src/services/attendance.service.ts
import prisma from '@/src/lib/prisma';
import { ethiopianDateToDate } from '@/src/lib/ethiopiancal';

export class AttendanceService {
  /**
   * Get events for a specific Ethiopian month and year
   */
  static async getEventsByEthiopianMonth(ethYear: number, ethMonth: number, type: 'chore' | 'sunday') {
    // Find events that match the Ethiopian month
    const events = await prisma.event.findMany({
      where: {
        ethiopianYear: ethYear,
        ethiopianMonth: ethMonth,
        ...(type === 'chore' 
          ? { title: { contains: 'Chore' } }
          : { title: { contains: 'Sunday' } }
        ),
      },
      include: {
        attendances: {
          include: {
            attendanceType: true,
          },
        },
      },
      orderBy: {
        ethiopianDay: 'asc',
      },
    });

    return events;
  }

  /**
   * Create events for all chore days in an Ethiopian month
   */
  static async createChoreEventsForMonth(ethYear: number, ethMonth: number, adminId: string) {
    const { getChoreDaysInMonth } = await import('@/src/lib/ethiopiancal');
    const choreDays = getChoreDaysInMonth(ethYear, ethMonth);
    
    const createdEvents = [];
    
    for (const ethDay of choreDays) {
      // Convert Ethiopian date to Gregorian for storage
      const gregDate = ethiopianDateToDate(ethDay);
      
      // Check if event already exists
      const existingEvent = await prisma.event.findFirst({
        where: {
          ethiopianYear: ethYear,
          ethiopianMonth: ethMonth,
          ethiopianDay: ethDay.day,
          title: { contains: 'Chore' },
        },
      });
      
      if (!existingEvent) {
        const event = await prisma.event.create({
          data: {
            title: `Chore Attendance - ${ethDay.month} ${ethDay.day}`,
            date: gregDate,
            ethiopianYear: ethYear,
            ethiopianMonth: ethMonth,
            ethiopianDay: ethDay.day,
            createdById: adminId,
          },
        });
        createdEvents.push(event);
      }
    }
    
    return createdEvents;
  }

  /**
   * Get attendance for a specific Ethiopian month
   */
  static async getAttendanceForEthiopianMonth(ethYear: number, ethMonth: number) {
    const events = await this.getEventsByEthiopianMonth(ethYear, ethMonth, 'chore');
    const eventIds = events.map((e: { id: string }) => e.id);
    
    const attendances = await prisma.attendance.findMany({
      where: {
        eventId: { in: eventIds },
      },
      include: {
        member: true,
        attendanceType: true,
        event: true,
      },
    });
    
    return attendances;
  }

  /**
   * Get attendance statistics for a specific Ethiopian month
   */
  static async getMonthlyStats(ethYear: number, ethMonth: number) {
    const events = await this.getEventsByEthiopianMonth(ethYear, ethMonth, 'chore');
    const eventIds = events.map((e: { id: string }) => e.id);
    
    const totalMembers = await prisma.user.count({
      where: { type: 'MEMBER' },
    });
    
    const attendances = await prisma.attendance.findMany({
      where: {
        eventId: { in: eventIds },
      },
      include: {
        attendanceType: true,
      },
    });
    
    const totalAttendances = attendances.length;
    const attendedCount = attendances.filter((a: { attendanceType: { name: string } }) => 
      a.attendanceType.name.toLowerCase().includes('attended') ||
      a.attendanceType.name.toLowerCase().includes('present')
    ).length;
    
    const attendanceRate = totalMembers > 0 && eventIds.length > 0
      ? (attendedCount / (totalMembers * eventIds.length)) * 100
      : 0;
    
    return {
      totalEvents: eventIds.length,
      totalMembers,
      totalAttendances,
      attendedCount,
      attendanceRate: Math.round(attendanceRate),
    };
  }
}