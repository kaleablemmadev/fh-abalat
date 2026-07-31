// /course/enrollments/[id]/edit/page.tsx
import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import EnrollmentForm from "../../components/EnrollmentForm";

export default async function EditEnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id },
    include: {
      student: true,
      courseClass: true,
    },
  });

  if (!enrollment) {
    notFound();
  }

  const courseClasses = await prisma.courseClass.findMany({
    where: { isActive: true },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  const students = await prisma.user.findMany({
    where: { 
      type: "MEMBER",
      memberType: "COURSE_STUDENT",
      isActive: true 
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Edit Enrollment
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Update enrollment status and details
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <EnrollmentForm
          initialData={{
            id: enrollment.id,
            studentId: enrollment.studentId,
            courseClassId: enrollment.courseClassId || undefined,
            status: enrollment.status,
            enrolledDate: enrollment.enrolledDate,
            unenrollmentDate: enrollment.unenrollmentDate?.toISOString().split('T')[0] || "",
            unenrollmentReason: enrollment.unenrollmentReason || "",
          }}
          isEditMode={true}
          courseClasses={courseClasses}
          students={students}
        />
      </div>
    </div>
  );
}
