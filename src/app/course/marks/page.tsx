import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { GraduationCap, ArrowRight, BookOpen, Users, Award } from "lucide-react";

export default async function CourseMarksDashboard() {
  const courseYears = await prisma.courseYear.findMany({
    where: { isActive: true },
    include: {
      course: {
        include: { instructor: true }
      },
      courseClass: true,
      _count: {
        select: {
          marks: true
        }
      }
    },
    orderBy: [
      { year: "desc" },
      { course: { name: "asc" } }
    ]
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          Student Marks
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Select a course to manage student grades and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courseYears.map((cy) => (
          <Link
            key={cy.id}
            href={`/course/marks/${cy.id}`}
            className="group rounded-lg p-6 transition-all duration-150 flex flex-col justify-between h-full"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-2 rounded transition-colors duration-150"
                  style={{
                    background: "hsl(var(--primary) / 0.1)",
                    color: "hsl(var(--primary))",
                  }}
                >
                  <BookOpen size={20} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                  {cy.year}
                </span>
              </div>

              <h2 className="text-lg font-bold line-clamp-1" title={cy.course.name} style={{ color: "hsl(var(--foreground))" }}>
                {cy.course.name}
              </h2>
              <p className="text-xs font-medium mt-1 uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                {cy.courseClass.name}
              </p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Users size={14} />
                  <span>{cy.course.instructor.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Award size={14} />
                  <span>{cy._count.marks} Graded Students</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-6 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
              Enter Marks <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}

        {courseYears.length === 0 && (
          <div className="col-span-full rounded-lg border-2 border-dashed p-12 text-center" style={{ borderColor: "hsl(var(--border))" }}>
            <GraduationCap size={32} className="mx-auto mb-3 opacity-20" />
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>No course-year mappings found</h3>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Assign a course to a class in the Setup section to start grading.</p>
            <Link href="/course/course-years/new" className="inline-flex mt-4 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
              Assign Course →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
