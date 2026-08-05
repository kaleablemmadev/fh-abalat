import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import BulkStudentForm from "./components/BulkStudentForm";

export default async function BulkStudentPage() {
  // Simplify queries to avoid connection timeout
  const academicYears = await prisma.academicYear.findMany({
    where: { isActive: true },
    orderBy: { year: 'desc' },
  });

  const courseClasses = await prisma.courseClass.findMany({
    where: { isActive: true },
    orderBy: [
      { year: 'desc' },
      { name: 'asc' },
    ],
  });

  return (
    <BulkStudentForm
      academicYears={academicYears}
      courseClasses={courseClasses}
    />
  );
}
