import prisma from "@/src/lib/prisma";

export class CourseFreeDayService {
  /**
   * Send notifications to students enrolled in a course year about an upcoming course-free day
   */
  static async sendNotifications(courseFreeDayId: string) {
    const courseFreeDay = await prisma.courseFreeDay.findUnique({
      where: { id: courseFreeDayId },
      include: {
        courseYear: {
          include: {
            courseClass: true,
            course: true,
          },
        },
      },
    });

    if (!courseFreeDay) {
      throw new Error("Course-free day not found");
    }

    // Get all enrolled students for this course class
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseClassId: courseFreeDay.courseYear.courseClassId,
        status: { in: ["ACTIVE", "PENDING"] },
      },
      include: {
        student: true,
      },
    });

    // Create notifications for each student
    const notifications = await Promise.all(
      enrollments.map((enrollment) =>
        prisma.notification.create({
          data: {
            title: "Course Cancelled",
            message: `The course "${courseFreeDay.courseYear.course.name}" for ${courseFreeDay.courseYear.courseClass.name} on ${courseFreeDay.date.toLocaleDateString()} has been cancelled. Reason: ${courseFreeDay.reason}`,
            type: "COURSE_CANCELLATION",
            mode: "COURSE",
            targetUserId: enrollment.studentId,
          },
        })
      )
    );

    // Update course-free day to mark notifications as sent
    await prisma.courseFreeDay.update({
      where: { id: courseFreeDayId },
      data: {
        notificationsSent: true,
        notificationDate: new Date(),
      },
    });

    return notifications;
  }

  /**
   * Check for upcoming course-free days and send notifications if needed
   * This should be run periodically (e.g., daily)
   */
  static async checkAndSendUpcomingNotifications() {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const upcomingFreeDays = await prisma.courseFreeDay.findMany({
      where: {
        date: {
          lte: twoWeeksFromNow,
          gte: new Date(),
        },
        notificationsSent: false,
      },
      include: {
        courseYear: {
          include: {
            courseClass: true,
            course: true,
          },
        },
      },
    });

    const results = await Promise.all(
      upcomingFreeDays.map((freeDay) =>
        this.sendNotifications(freeDay.id).catch((error) => {
          console.error(`Failed to send notifications for course-free day ${freeDay.id}:`, error);
          return null;
        })
      )
    );

    return results.filter((r) => r !== null);
  }

  /**
   * Check if a specific date is a course-free day for a course year
   */
  static async isCourseFreeDay(courseYearId: string, date: Date): Promise<boolean> {
    const freeDay = await prisma.courseFreeDay.findUnique({
      where: {
        courseYearId_date: {
          courseYearId,
          date,
        },
      },
    });

    return !!freeDay;
  }

  /**
   * Get all course-free days for a specific date across all course years
   */
  static async getCourseFreeDaysForDate(date: Date) {
    return prisma.courseFreeDay.findMany({
      where: { date },
      include: {
        courseYear: {
          include: {
            course: true,
            courseClass: true,
          },
        },
      },
    });
  }
}
