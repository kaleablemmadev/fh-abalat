import prisma from "@/src/lib/prisma";
import ReportCenter from "./components/ReportCenter";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  const academicYears = await prisma.academicYear.findMany({
    orderBy: { year: 'desc' }
  });

  // Get students enrolled in the active year (or any recent students)
  const students = await prisma.user.findMany({
    where: {
      type: 'MEMBER',
      enrollments: {
        some: {
          courseClass: {
            academicYearId: activeYear?.id
          },
          status: 'ACTIVE'
        }
      }
    },
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true }
  });

  // Get recent exam events for eligibility report
  const events = await prisma.event.findMany({
    where: {
      mode: 'COURSE',
      isActive: true,
      OR: [
        { title: { contains: 'Exam' } },
        { title: { contains: 'Mid' } },
        { title: { contains: 'Final' } }
      ]
    },
    orderBy: { date: 'desc' },
    take: 20
  });

  return (
    <ReportCenter
      academicYears={academicYears}
      students={students}
      events={events}
    />
  );
}
