// /course/enrollments/new/page.tsx
import prisma from "@/src/lib/prisma";
import EnrollmentForm from "../components/EnrollmentForm";

export default async function NewEnrollmentPage() {
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
      <div>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          New Enrollment
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Enroll a student to a course class
        </p>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <EnrollmentForm courseClasses={courseClasses} students={students} />
      </div>
    </div>
  );
}
