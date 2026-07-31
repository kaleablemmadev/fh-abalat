// /course/courses/[id]/edit/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import CourseForm from "../../components/CourseForm";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: true,
    },
  });

  if (!course) {
    notFound();
  }

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
          Edit Course
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Update course details
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <CourseForm
          initialData={{
            id: course.id,
            name: course.name,
            description: course.description || "",
            topics: course.topics,
            credits: course.credits || undefined,
            instructorId: course.instructorId,
            departmentId: course.departmentId,
          }}
          isEditMode={true}
          instructors={instructors}
          departments={departments}
        />
      </div>
    </div>
  );
}
