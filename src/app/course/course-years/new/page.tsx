// /course/course-years/new/page.tsx
import prisma from "@/src/lib/prisma";
import CourseYearForm from "../components/CourseYearForm";

export default async function NewCourseYearPage() {
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
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          New Course Year
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Assign a course to a class and configure assessment weights
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <CourseYearForm courses={courses} courseClasses={courseClasses} />
      </div>
    </div>
  );
}
