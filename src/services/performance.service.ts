import prisma from '@/src/lib/prisma';
import { TeachingHoursService } from './teaching-hours.service';

export class PerformanceService {
  /**
   * Check teaching milestones for all instructors in an academic year
   * Trigger notifications at 50% and 75% of required hours
   */
  static async checkTeachingMilestones(academicYearId: string) {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      include: {
        classes: {
          include: {
            courseYears: {
              include: {
                course: true,
                instructor: true
              }
            }
          }
        }
      }
    });

    if (!academicYear) return;

    for (const cls of academicYear.classes) {
      for (const cy of cls.courseYears) {
        if (!cy.instructorId) continue;

        // Calculate hours taught for this courseYear
        const attendances = await prisma.instructorAttendance.findMany({
          where: {
            instructorId: cy.instructorId,
            courseId: cy.courseId,
            attendanceType: { name: 'Present' },
            event: {
              courseClassId: cls.id
            }
          }
        });

        const hoursTaught = attendances.reduce((sum, a) => sum + (a.durationHours || 1.0), 0);
        const requiredHours = cy.course.requiredHours || 0;

        if (requiredHours === 0) continue;

        const progress = hoursTaught / requiredHours;

        // Trigger milestones
        if (progress >= 0.75) {
          await this.triggerMilestoneNotification(cy.instructorId, cy.course.name, 75, academicYear.year);
        } else if (progress >= 0.5) {
          await this.triggerMilestoneNotification(cy.instructorId, cy.course.name, 50, academicYear.year);
        }
      }
    }
  }

  private static async triggerMilestoneNotification(instructorId: string, courseName: string, milestone: number, year: string) {
    const title = `Teaching Milestone: ${milestone}%`;
    const message = `Instructor has completed ${milestone}% of required hours for ${courseName} (${year}).`;

    // Check if notification already exists to avoid spam
    const existing = await prisma.notification.findFirst({
      where: {
        targetUserId: instructorId,
        title,
        createdAt: {
          // Assuming milestones are checked within the same academic year context
          gte: new Date(new Date().getFullYear(), 0, 1)
        }
      }
    });

    if (!existing) {
      // Notify both the instructor (if they are a user) and admins
      const admins = await prisma.user.findMany({
        where: { type: { in: ['ADMIN', 'SUPERADMIN'] }, mode: 'COURSE' }
      });

      const notifications = admins.map(admin => prisma.notification.create({
        data: {
          title,
          message,
          type: 'PERFORMANCE',
          mode: 'COURSE',
          targetUserId: admin.id
        }
      }));

      await Promise.all(notifications);
    }
  }

  /**
   * Get teaching progress for an instructor
   */
  static async getInstructorProgress(instructorId: string, academicYearId: string) {
    const courseYears = await prisma.courseYear.findMany({
      where: {
        instructorId,
        courseClass: { academicYearId }
      },
      include: {
        course: true,
        courseClass: true
      }
    });

    const progress = await Promise.all(courseYears.map(async cy => {
      const attendances = await prisma.instructorAttendance.findMany({
        where: {
          instructorId,
          courseId: cy.courseId,
          attendanceType: { name: 'Present' }
        }
      });

      const taught = attendances.reduce((sum, a) => sum + (a.durationHours || 1.0), 0);
      const required = cy.course.requiredHours || 0;

      return {
        courseName: cy.course.name,
        className: cy.courseClass.name,
        taught,
        required,
        percent: required > 0 ? (taught / required) * 100 : 0
      };
    }));

    return progress;
  }
}
