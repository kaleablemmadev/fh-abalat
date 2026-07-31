// /course/course-years/[id]/edit/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import CourseYearForm from "../../components/CourseYearForm";

export default async function EditCourseYearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseYear = await prisma.courseYear.findUnique({
    where: { id },
    include: {
      course: true,
      courseClass: true,
    },
  });

  if (!courseYear) {
    notFound();
  }

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
          Edit Course Year
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Update course year configuration
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <CourseYearForm
          initialData={{
            id: courseYear.id,
            courseId: courseYear.courseId,
            courseClassId: courseYear.courseClassId,
            year: courseYear.year,
            startDate: courseYear.startDate.toISOString().split('T')[0],
            endDate: courseYear.endDate.toISOString().split('T')[0],
            attendanceWeight: courseYear.attendanceWeight,
            midExamWeight: courseYear.midExamWeight,
            assignmentWeight: courseYear.assignmentWeight,
            finalExamWeight: courseYear.finalExamWeight,
          }}
          isEditMode={true}
          courses={courses}
          courseClasses={courseClasses}
        />
      </div>
    </div>
  );
}
