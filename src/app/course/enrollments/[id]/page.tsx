import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import EnrollmentDetailsClient from "../components/EnrollmentDetailsClient";

export default async function EnrollmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id },
    include: {
      student: true,
      courseClass: true,
    }
  });

  if (!enrollment) notFound();

  // Get courses associated with this class to check completion
  const courseOfferings = await prisma.courseYear.findMany({
    where: { courseClassId: enrollment.courseClassId || "" },
    include: {
      course: true,
      marks: {
        where: { studentId: enrollment.studentId }
      }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <EnrollmentDetailsClient
        enrollment={enrollment as any}
        courseOfferings={courseOfferings as any}
      />
    </div>
  );
}
