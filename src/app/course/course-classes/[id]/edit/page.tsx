// /course/course-classes/[id]/edit/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import CourseClassForm from "../../components/CourseClassForm";

export default async function EditCourseClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseClass = await prisma.courseClass.findUnique({
    where: { id },
  });

  if (!courseClass) {
    notFound();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Edit Course Class
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Update course class details
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <CourseClassForm
          initialData={{
            id: courseClass.id,
            name: courseClass.name,
            year: courseClass.year,
            startDate: courseClass.startDate?.toISOString().split('T')[0] || "",
            endDate: courseClass.endDate?.toISOString().split('T')[0] || "",
          }}
          isEditMode={true}
        />
      </div>
    </div>
  );
}
