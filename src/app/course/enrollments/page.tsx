// /course/enrollments/page.tsx
import prisma from "@/src/lib/prisma";
import { enrollmentStatusDisplayNames } from "../constants/courseEnum";
import EnrollmentListClient from "./components/EnrollmentListClient";

export default async function EnrollmentsPage() {
  const enrollments = await prisma.courseEnrollment.findMany({
    include: {
      student: true,
      courseClass: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const courseClasses = await prisma.courseClass.findMany({
    where: { isActive: true },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  const students = await prisma.user.findMany({
    where: { 
      type: "MEMBER",
      memberTypes: { has: "COURSE_STUDENT" },
      isActive: true 
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Class Enrollments
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Manage student enrollments in course classes
          </p>
        </div>
      </div>

      <EnrollmentListClient 
        enrollments={enrollments}
        courseClasses={courseClasses}
        students={students}
        statusNames={enrollmentStatusDisplayNames}
      />
    </div>
  );
}
