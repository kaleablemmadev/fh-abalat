import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import InstructorAttendanceClient from "./components/InstructorAttendanceClient";

export default async function InstructorAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const academicYear = await prisma.academicYear.findUnique({
    where: { id },
    include: {
      classes: {
        include: {
          courseYears: {
            include: {
              course: true,
              instructor: true,
            },
          },
        },
      },
    },
  });

  if (!academicYear) notFound();

  // Get all unique instructors assigned to courses in this academic year
  const instructors = await prisma.instructor.findMany({
    where: {
      courseYears: {
        some: {
          courseClass: {
            academicYearId: id,
          },
        },
      },
    },
    orderBy: { fullName: "asc" },
  });

  // Get all events for this academic year
  const events = await prisma.event.findMany({
    where: {
      courseClass: {
        academicYearId: id,
      },
      isActive: true,
    },
    include: {
      courseClass: true,
    },
    orderBy: { date: "asc" },
  });

  return (
    <InstructorAttendanceClient
      academicYear={academicYear}
      instructors={instructors}
      events={events.filter(e => e.courseClass !== null)}
    />
  );
}
