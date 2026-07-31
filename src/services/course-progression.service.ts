import prisma from "@/src/lib/prisma";
import { CourseClassType } from "@/src/generated/prisma/client";

export class CourseProgressionService {
  private static progressionMap: Record<CourseClassType, CourseClassType | null> = {
    KEDAMAY: "KALEAY",
    KEREMT: "KALEAY",
    KALEAY: "SALSAY",
    SALSAY: "RABEAY",
    RABEAY: null, // Graduation
  };

  /**
   * Automatically enrolls a student in the next logical class level if they passed the current one.
   */
  static async progressStudent(studentId: string, currentEnrollmentId: string) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: currentEnrollmentId },
      include: { courseClass: true }
    });

    if (!enrollment || !enrollment.courseClass || enrollment.passStatus !== "PASSED") {
      return { success: false, reason: "Enrollment not found or not passed" };
    }

    const currentType = enrollment.courseClass.name;
    const nextType = this.progressionMap[currentType];

    if (!nextType) {
      return { success: true, reason: "Student has graduated all levels" };
    }

    // Determine next year (usually current year + 1)
    const currentYear = parseInt(enrollment.courseClass.year);
    const nextYearStr = (currentYear + 1).toString();

    // Find or create the next class
    let nextClass = await prisma.courseClass.findUnique({
      where: {
        name_year: {
          name: nextType,
          year: nextYearStr
        }
      }
    });

    if (!nextClass) {
        // Auto-create next class if it doesn't exist?
        // Maybe better to fail and ask admin to create the class first.
        // For now, let's try to find ANY class with nextType and year >= nextYear
        nextClass = await prisma.courseClass.findFirst({
            where: { name: nextType, year: { gte: nextYearStr }, isActive: true },
            orderBy: { year: "asc" }
        });
    }

    if (!nextClass) {
      return { success: false, reason: `Next class level ${nextType} for year ${nextYearStr} or later not found. Please create it first.` };
    }

    // Check if already enrolled in next class
    const existingNext = await prisma.courseEnrollment.findUnique({
      where: {
        courseClassId_studentId: {
          courseClassId: nextClass.id,
          studentId
        }
      }
    });

    if (existingNext) {
      return { success: true, reason: "Already enrolled in next level" };
    }

    // Create new enrollment
    await prisma.courseEnrollment.create({
      data: {
        studentId,
        courseClassId: nextClass.id,
        enrolledDate: new Date().toLocaleDateString(),
        status: "ACTIVE"
      }
    });

    return { success: true, nextClass: nextClass.name };
  }
}
