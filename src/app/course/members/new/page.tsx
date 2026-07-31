import prisma from "@/src/lib/prisma";
import CourseStudentForm from "./components/CourseStudentForm";

export default async function NewCourseStudentPage() {
  const courseClasses = await prisma.courseClass.findMany({
    where: { isActive: true },
    orderBy: [{ year: "desc" }, { name: "asc" }],
  });

  return (
    <div className="animate-fade-in">
      <CourseStudentForm courseClasses={courseClasses as any} />
    </div>
  );
}
