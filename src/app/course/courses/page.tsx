// /course/courses/page.tsx
import prisma from "@/src/lib/prisma";
import CourseListClient from "./components/CourseListClient";

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      instructor: true,
      courseYears: {
        include: {
          courseClass: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const instructors = await prisma.instructor.findMany({
    where: { isActive: true },
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
            Courses
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Manage courses and their instructors
          </p>
        </div>
      </div>

      <CourseListClient courses={courses} instructors={instructors} />
    </div>
  );
}
