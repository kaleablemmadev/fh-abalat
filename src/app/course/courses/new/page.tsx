// /course/courses/new/page.tsx
import prisma from "@/src/lib/prisma";
import CourseForm from "../components/CourseForm";

export default async function NewCoursePage() {
  const [instructors, departments] = await Promise.all([
    prisma.instructor.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          New Course
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Create a new course with topics and instructor
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <CourseForm instructors={instructors} departments={departments} />
      </div>
    </div>
  );
}
