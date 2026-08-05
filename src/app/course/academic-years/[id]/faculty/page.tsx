import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import FacultyManagementClient from "./components/FacultyManagementClient";

export default async function ManageYearFacultyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const academicYear = await prisma.academicYear.findUnique({
    where: { id },
    include: {
      classes: {
        include: {
          courseYears: {
            include: {
              course: true,
              courseClass: true,
            }
          }
        }
      }
    }
  });

  if (!academicYear) notFound();

  const instructors = await prisma.instructor.findMany({
    where: { isActive: true },
    orderBy: { fullName: "asc" }
  });

  // Flatten courseYears from all classes
  const offerings = academicYear.classes.flatMap(c => c.courseYears);

  return (
    <FacultyManagementClient
      academicYearId={id}
      initialOfferings={offerings as any}
      instructors={instructors}
    />
  );
}
