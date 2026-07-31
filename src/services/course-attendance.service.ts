import prisma from '@/src/lib/prisma';
import { gregorianToEthiopianDate } from '@/src/lib/ethiopiancal';

export class CourseAttendanceService {
  /**
   * Generate events for a course class based on its name and date range
   */
  static async generateEventsForClass(classId: string, adminId: string) {
    const courseClass = await prisma.courseClass.findUnique({
      where: { id: classId },
    });

    if (!courseClass || !courseClass.startDate || !courseClass.endDate) {
      throw new Error('Class or term dates not found');
    }

    const events = [];
    const current = new Date(courseClass.startDate);
    const end = new Date(courseClass.endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      let shouldCreate = false;

      if (courseClass.name === 'KEREMT') {
        // Keremt: Mon-Sat (1-6)
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
          shouldCreate = true;
        }
      } else {
        // Regular classes: Sat-Sun (6, 0)
        if (dayOfWeek === 6 || dayOfWeek === 0) {
          shouldCreate = true;
        }
      }

      if (shouldCreate) {
        const ethDate = gregorianToEthiopianDate({
          year: current.getFullYear(),
          month: current.getMonth() + 1,
          day: current.getDate(),
        });

        // Check if event already exists
        const dayStart = new Date(current);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);

        const existing = await prisma.event.findFirst({
          where: {
            courseClassId: classId,
            date: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        });

        if (!existing) {
          const event = await prisma.event.create({
            data: {
              title: `${courseClass.name} Session`,
              date: new Date(current),
              ethiopianYear: ethDate.year,
              ethiopianMonth: ethDate.month,
              ethiopianDay: ethDate.day,
              eventType: 'EVENT',
              createdById: adminId,
              courseClassId: classId,
            },
          });
          events.push(event);
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return events;
  }

  /**
   * Calculate student attendance score for a specific class
   * Returns a value out of 100
   */
  static async calculateStudentAttendanceScore(studentId: string, classId: string) {
    const events = await prisma.event.findMany({
      where: { courseClassId: classId, isActive: true },
      select: { id: true },
    });

    if (events.length === 0) return 100; // Default to full score if no events

    const eventIds = events.map((e) => e.id);

    const attendances = await prisma.attendance.findMany({
      where: {
        memberId: studentId,
        eventId: { in: eventIds },
      },
      include: {
        attendanceType: true,
      },
    });

    const totalWeight = attendances.reduce((acc, curr) => acc + (curr.attendanceType?.value || 0), 0);
    const score = (totalWeight / events.length) * 100;

    return Math.min(Math.max(score, 0), 100);
  }
}
