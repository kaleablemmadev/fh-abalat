import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import EditStudentForm from "./components/EditStudentForm";

export default async function EditCourseStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const student = await prisma.user.findFirst({
    where: {
      OR: [
        { id: id },
        { privateId: id }
      ]
    }
  });

  if (!student) notFound();

  return (
    <div className="animate-fade-in">
      <EditStudentForm student={student as any} />
    </div>
  );
}
