import prisma from '@/src/lib/prisma';

export class FollowUpService {
  /**
   * Check if a student has missed 2 consecutive classes
   * Triggered when a new absence is recorded
   */
  static async checkConsecutiveAbsences(studentId: string, currentEventId: string) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { courseClass: true }
    });

    if (!student || !student.courseClassId) return;

    // Get the last 2 attendances for this student in this class
    const lastAttendances = await prisma.attendance.findMany({
      where: {
        memberId: studentId,
        event: {
          courseClassId: student.courseClassId,
          isActive: true
        }
      },
      include: {
        attendanceType: true,
        event: true
      },
      orderBy: {
        event: {
          date: 'desc'
        }
      },
      take: 2
    });

    // If there are at least 2 attendances and both are "Absent" (value 0)
    const allAbsent = lastAttendances.length >= 2 &&
                     lastAttendances.every(a => a.attendanceType.value === 0);

    if (allAbsent) {
      // Check if there's already a pending follow-up
      const existing = await prisma.studentFollowUp.findFirst({
        where: {
          studentId,
          status: 'PENDING'
        }
      });

      if (!existing) {
        await prisma.studentFollowUp.create({
          data: {
            studentId,
            reason: 'Missed 2 consecutive classes'
          }
        });

        // Notify admins
        const admins = await prisma.user.findMany({
          where: { type: { in: ['ADMIN', 'SUPERADMIN'] }, mode: 'COURSE' }
        });

        const notifications = admins.map(admin => prisma.notification.create({
          data: {
            title: 'Attendance Alert',
            message: `Student ${student.fullName} has missed 2 consecutive classes. Follow-up required.`,
            type: 'ALERT',
            mode: 'COURSE',
            targetUserId: admin.id
          }
        }));

        await Promise.all(notifications);
      }
    }
  }

  /**
   * Resolve a follow-up action
   */
  static async resolveFollowUp(followUpId: string, status: 'CALLED' | 'INACTIVE' | 'REMOVED', notes?: string) {
    const followUp = await prisma.studentFollowUp.update({
      where: { id: followUpId },
      data: {
        status,
        notes,
        resolvedAt: new Date()
      }
    });

    if (status === 'INACTIVE') {
      await prisma.user.update({
        where: { id: followUp.studentId },
        data: { isActive: false }
      });
    }

    return followUp;
  }

  /**
   * Get all pending follow-ups
   */
  static async getPendingFollowUps() {
    return await prisma.studentFollowUp.findMany({
      where: { status: 'PENDING' },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            courseClass: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
