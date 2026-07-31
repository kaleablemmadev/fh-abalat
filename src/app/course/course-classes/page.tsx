// /course/course-classes/page.tsx
import prisma from "@/src/lib/prisma";
import { courseClassTypeDisplayNames } from "../constants/courseEnum";
import CourseClassListClient from "./components/CourseClassListClient";

export default async function CourseClassesPage() {
  const courseClasses = await prisma.courseClass.findMany({
    where: { isActive: true },
    include: {
      courseYears: {
        include: {
          course: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Course Classes
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Manage course class instances by year
          </p>
        </div>
      </div>

      <CourseClassListClient 
        courseClasses={courseClasses} 
        displayNames={courseClassTypeDisplayNames}
      />
    </div>
  );
}
