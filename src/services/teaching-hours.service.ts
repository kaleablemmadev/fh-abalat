import prisma from '@/src/lib/prisma';

export class TeachingHoursService {
  /**
   * Calculate weekly teaching hours for a class type
   * Regular classes (KEDAMAY, KALEAY, SALSAY, RABEAY): duration * 2 days (Sat + Sun)
   * Keremt: duration * 6 days (Mon-Sat)
   */
  static getWeeklyHoursForClass(courseClass: { name: string, dailyDurationHours: number }): number {
    if (courseClass.name === 'KEREMT') {
      return courseClass.dailyDurationHours * 6;
    }
    return courseClass.dailyDurationHours * 2;
  }

  /**
   * Calculate total available teaching hours for a date range
   * Excluding course-free days
   */
  static async calculateAvailableHours(
    courseClassId: string,
    startDate: Date,
    endDate: Date,
    semester?: 'FIRST' | 'SECOND'
  ): Promise<number> {
    const courseClass = await prisma.courseClass.findUnique({
      where: { id: courseClassId },
    });

    if (!courseClass) {
      throw new Error('Course class not found');
    }

    const weeklyHours = this.getWeeklyHoursForClass(courseClass);
    
    // Calculate total weeks in the period
    const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    // Calculate total available hours before course-free days
    let totalHours = totalWeeks * weeklyHours;

    // Get course-free days for this period
    const courseYears = await prisma.courseYear.findMany({
      where: { courseClassId },
      select: { id: true },
    });

    const courseYearIds = courseYears.map(cy => cy.id);

    const freeDays = await prisma.courseFreeDay.findMany({
      where: {
        courseYearId: { in: courseYearIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Subtract hours for each course-free day
    for (const freeDay of freeDays) {
      const dayOfWeek = freeDay.date.getDay();
      
      if (courseClass.name === 'KEREMT') {
        // Keremt: Mon-Sat (1-6), each day is duration hours
        if (dayOfWeek >= 1 && dayOfWeek <= 6) {
          totalHours -= courseClass.dailyDurationHours;
        }
      } else {
        // Regular classes: Sat-Sun (6, 0), each day is duration hours
        if (dayOfWeek === 6 || dayOfWeek === 0) {
          totalHours -= courseClass.dailyDurationHours;
        }
      }
    }

    return Math.max(0, totalHours);
  }

  /**
   * Calculate total required hours for all courses in a class
   */
  static async calculateRequiredHours(courseClassId: string): Promise<number> {
    const courseYears = await prisma.courseYear.findMany({
      where: { courseClassId },
      include: {
        course: true,
      },
    });

    let totalRequiredHours = 0;
    for (const courseYear of courseYears) {
      totalRequiredHours += courseYear.course.requiredHours || 0;
    }

    return totalRequiredHours;
  }

  /**
   * Calculate semester-based hours for an academic year
   */
  static async calculateAcademicYearHours(academicYearId: string) {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
      include: {
        classes: true,
      },
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    const results = {
      firstSemester: {
        availableHours: 0,
        requiredHours: 0,
        freeHours: 0,
      },
      secondSemester: {
        availableHours: 0,
        requiredHours: 0,
        freeHours: 0,
      },
      total: {
        availableHours: 0,
        requiredHours: 0,
        freeHours: 0,
      },
    };

    for (const courseClass of academicYear.classes) {
      // First semester
      if (academicYear.s1Start && academicYear.s1End) {
        const s1Available = await this.calculateAvailableHours(
          courseClass.id,
          new Date(academicYear.s1Start),
          new Date(academicYear.s1End),
          'FIRST'
        );
        
        const s1CourseYears = await prisma.courseYear.findMany({
          where: {
            courseClassId: courseClass.id,
            semester: 'FIRST',
          },
          include: {
            course: true,
          },
        });

        const s1Required = s1CourseYears.reduce((sum, cy) => sum + (cy.course.requiredHours || 0), 0);

        results.firstSemester.availableHours += s1Available;
        results.firstSemester.requiredHours += s1Required;
      }

      // Second semester
      if (academicYear.s2Start && academicYear.s2End) {
        const s2Available = await this.calculateAvailableHours(
          courseClass.id,
          new Date(academicYear.s2Start),
          new Date(academicYear.s2End),
          'SECOND'
        );
        
        const s2CourseYears = await prisma.courseYear.findMany({
          where: {
            courseClassId: courseClass.id,
            semester: 'SECOND',
          },
          include: {
            course: true,
          },
        });

        const s2Required = s2CourseYears.reduce((sum, cy) => sum + (cy.course.requiredHours || 0), 0);

        results.secondSemester.availableHours += s2Available;
        results.secondSemester.requiredHours += s2Required;
      }
    }

    // Calculate free hours
    results.firstSemester.freeHours = Math.max(0, results.firstSemester.availableHours - results.firstSemester.requiredHours);
    results.secondSemester.freeHours = Math.max(0, results.secondSemester.availableHours - results.secondSemester.requiredHours);

    // Calculate totals
    results.total.availableHours = results.firstSemester.availableHours + results.secondSemester.availableHours;
    results.total.requiredHours = results.firstSemester.requiredHours + results.secondSemester.requiredHours;
    results.total.freeHours = Math.max(0, results.total.availableHours - results.total.requiredHours);

    return results;
  }

  /**
   * Get hours breakdown for a specific course class
   */
  static async getClassHoursBreakdown(courseClassId: string) {
    const courseClass = await prisma.courseClass.findUnique({
      where: { id: courseClassId },
      include: {
        academicYear: true,
      },
    });

    if (!courseClass || !courseClass.academicYear) {
      throw new Error('Course class or academic year not found');
    }

    const academicYear = courseClass.academicYear;

    const results = {
      firstSemester: {
        availableHours: 0,
        requiredHours: 0,
        freeHours: 0,
      },
      secondSemester: {
        availableHours: 0,
        requiredHours: 0,
        freeHours: 0,
      },
      total: {
        availableHours: 0,
        requiredHours: 0,
        freeHours: 0,
      },
    };

    // First semester
    if (academicYear.s1Start && academicYear.s1End) {
      const s1Available = await this.calculateAvailableHours(
        courseClass.id,
        new Date(academicYear.s1Start),
        new Date(academicYear.s1End),
        'FIRST'
      );
      
      const s1CourseYears = await prisma.courseYear.findMany({
        where: {
          courseClassId: courseClass.id,
          semester: 'FIRST',
        },
        include: {
          course: true,
        },
      });

      const s1Required = s1CourseYears.reduce((sum, cy) => sum + (cy.course.requiredHours || 0), 0);

      results.firstSemester.availableHours = s1Available;
      results.firstSemester.requiredHours = s1Required;
      results.firstSemester.freeHours = Math.max(0, s1Available - s1Required);
    }

    // Second semester
    if (academicYear.s2Start && academicYear.s2End) {
      const s2Available = await this.calculateAvailableHours(
        courseClass.id,
        new Date(academicYear.s2Start),
        new Date(academicYear.s2End),
        'SECOND'
      );
      
      const s2CourseYears = await prisma.courseYear.findMany({
        where: {
          courseClassId: courseClass.id,
          semester: 'SECOND',
        },
        include: {
          course: true,
        },
      });

      const s2Required = s2CourseYears.reduce((sum, cy) => sum + (cy.course.requiredHours || 0), 0);

      results.secondSemester.availableHours = s2Available;
      results.secondSemester.requiredHours = s2Required;
      results.secondSemester.freeHours = Math.max(0, s2Available - s2Required);
    }

    // Calculate totals
    results.total.availableHours = results.firstSemester.availableHours + results.secondSemester.availableHours;
    results.total.requiredHours = results.firstSemester.requiredHours + results.secondSemester.requiredHours;
    results.total.freeHours = Math.max(0, results.total.availableHours - results.total.requiredHours);

    return results;
  }
}
