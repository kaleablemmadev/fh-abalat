import prisma from "@/src/lib/prisma";

export class CourseEnrollmentService {
  /**
   * Automatically assigns a student to all courses defined for their class in the current active year.
   * This creates Mark records which represent their enrollment in specific courses.
   *
   * Requirement: Students in Kedamay class are automatically assigned to every course in Kedamay.
   */
  static async autoEnrollInCourses(studentId: string, courseClassId: string, tx?: any) {
    const db = tx || prisma;
    try {
      // Find the class to check its name
      const targetClass = await db.courseClass.findUnique({
        where: { id: courseClassId }
      });

      if (!targetClass) return;

      // Find all active CourseYear records for this class
      const courseYears = await db.courseYear.findMany({
        where: {
          courseClassId: courseClassId,
          isActive: true,
        },
      });

      if (courseYears.length === 0) {
        console.warn(`No active courses found for class ${targetClass.name} (${targetClass.year}).`);
        return;
      }

      // Create Mark records for each course if they don't already exist
      // Use sequential execution to avoid potential issues with driver adapters in transactions
      for (const cy of courseYears) {
        await db.mark.upsert({
          where: {
            studentId_courseYearId: {
              studentId: studentId,
              courseYearId: cy.id,
            },
          },
          update: {}, // No change if exists
          create: {
            studentId: studentId,
            courseYearId: cy.id,
          },
        });
      }

      console.log(`Auto-enrolled student ${studentId} in ${courseYears.length} courses for ${targetClass.name}.`);
    } catch (error) {
      console.error("Error in autoEnrollInCourses:", error);
      throw error;
    }
  }
}
