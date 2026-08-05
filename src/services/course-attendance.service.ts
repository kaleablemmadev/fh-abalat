import prisma from '@/src/lib/prisma';
import { gregorianToEthiopianDate } from '@/src/lib/ethiopiancal';
import { CourseFreeDayService } from './course-free-day.service';

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

    // Get all course years for this class to check for course-free days
    const courseYears = await prisma.courseYear.findMany({
      where: { courseClassId: classId },
      select: { id: true },
    });

    const courseYearIds = courseYears.map(cy => cy.id);

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
        // Regular classes (KEDAMAY, KALEAY, SALSAY, RABEAY): Sat-Sun (6, 0)
        if (dayOfWeek === 6 || dayOfWeek === 0) {
          shouldCreate = true;
        }
      }

      if (shouldCreate) {
        // Check if this date is a course-free day for any of the course years
        const dayStart = new Date(current);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);

        const isFreeDay = await prisma.courseFreeDay.findFirst({
          where: {
            courseYearId: { in: courseYearIds },
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });

        if (!isFreeDay) {
          const ethDate = gregorianToEthiopianDate({
            year: current.getFullYear(),
            month: current.getMonth() + 1,
            day: current.getDate(),
          });

          // Check if event already exists
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
      }

      current.setDate(current.getDate() + 1);
    }

    return events;
  }

  /**
   * Calculate student attendance score for a specific class
   * Returns a value out of the provided weight
   * Excludes course-free days from the calculation
   */
  static async calculateStudentAttendanceScore(studentId: string, classId: string, weight: number = 10) {
    const events = await prisma.event.findMany({
      where: { courseClassId: classId, isActive: true },
      select: { id: true, date: true },
    });

    if (events.length === 0) return weight; // Default to full score if no events

    // Get all course years for this class
    const courseYears = await prisma.courseYear.findMany({
      where: { courseClassId: classId },
      select: { id: true },
    });

    const courseYearIds = courseYears.map(cy => cy.id);

    // Filter out events that fall on course-free days
    const validEvents = [];
    for (const event of events) {
      const dayStart = new Date(event.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(event.date);
      dayEnd.setHours(23, 59, 59, 999);

      const isFreeDay = await prisma.courseFreeDay.findFirst({
        where: {
          courseYearId: { in: courseYearIds },
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      if (!isFreeDay) {
        validEvents.push(event);
      }
    }

    if (validEvents.length === 0) return weight; // Default to full score if no valid events

    const eventIds = validEvents.map((e) => e.id);

    const attendances = await prisma.attendance.findMany({
      where: {
        memberId: studentId,
        eventId: { in: eventIds },
      },
      include: {
        attendanceType: true,
      },
    });

    const totalValue = attendances.reduce((acc, curr) => acc + (curr.attendanceType?.value || 0), 0);
    const score = (totalValue / validEvents.length) * weight;

    return Math.min(Math.max(score, 0), weight);
  }

  /**
   * Check if attendance can be marked for a specific event
   * Returns false if the event falls on a course-free day
   */
  static async canMarkAttendance(eventId: string): Promise<{ canMark: boolean; reason?: string }> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        courseClass: true,
      },
    });

    if (!event || !event.courseClassId) {
      return { canMark: true }; // Allow for non-course events
    }

    // Get course years for this class
    const courseYears = await prisma.courseYear.findMany({
      where: { courseClassId: event.courseClassId },
      select: { id: true },
    });

    const courseYearIds = courseYears.map(cy => cy.id);

    // Check if this event date is a course-free day
    const dayStart = new Date(event.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(event.date);
    dayEnd.setHours(23, 59, 59, 999);

    const freeDay = await prisma.courseFreeDay.findFirst({
      where: {
        courseYearId: { in: courseYearIds },
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        courseYear: {
          include: {
            course: true,
          },
        },
      },
    });

    if (freeDay) {
      return {
        canMark: false,
        reason: `Cannot mark attendance: Course "${freeDay.courseYear.course.name}" is cancelled on this date. Reason: ${freeDay.reason}`,
      };
    }

    return { canMark: true };
  }
}
