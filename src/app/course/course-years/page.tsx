// /course/course-years/page.tsx
import prisma from "@/src/lib/prisma";
import CourseYearListClient from "./components/CourseYearListClient";

export default async function CourseYearsPage() {
  const courseYears = await prisma.courseYear.findMany({
    where: { isActive: true },
    include: {
      course: {
        include: {
          instructor: true,
        },
      },
      courseClass: true,
      marks: {
        include: {
          student: true,
        },
      },
    },
    orderBy: [{ year: "desc" }, { course: { name: "asc" } }],
  });

  const courses = await prisma.course.findMany({
    where: { isGiven: true },
    orderBy: { name: "asc" },
  });

  const courseClasses = await prisma.courseClass.findMany({
    where: { isActive: true },
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
            Course Years
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Assign courses to classes and configure assessment weights
          </p>
        </div>
      </div>

      <CourseYearListClient 
        courseYears={courseYears}
        courses={courses}
        courseClasses={courseClasses}
      />
    </div>
  );
}
