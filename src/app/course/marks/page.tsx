import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { GraduationCap, ArrowRight, BookOpen, Users, Award } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CourseMarksDashboard() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
    include: {
      classes: {
        where: { isActive: true },
        include: {
          courseYears: {
            include: {
              course: {
                include: { instructor: true }
              },
              _count: {
                select: {
                  marks: true
                }
              }
            },
            orderBy: { course: { name: "asc" } }
          }
        },
        orderBy: { name: "asc" }
      }
    }
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            Student Marks
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {activeYear ? `Active Academic Year: ${activeYear.year}` : "Select a course to manage student grades and performance"}
          </p>
        </div>
        <Link
          href="/course/academic-years"
          className="text-xs font-bold px-3 py-1.5 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] transition-colors"
        >
          Manage Years
        </Link>
      </div>

      {!activeYear && (
        <div className="rounded-lg border-2 border-dashed p-12 text-center" style={{ borderColor: "hsl(var(--border))" }}>
          <GraduationCap size={32} className="mx-auto mb-3 opacity-20" />
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>No active academic year found</h3>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Initialize an academic year to start grading.</p>
          <Link href="/course/academic-years" className="inline-flex mt-4 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
            Setup Academic Year →
          </Link>
        </div>
      )}

      {activeYear?.classes.map((cls: any) => (
        <div key={cls.id} className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-5 w-1 bg-[hsl(217,70%,32%)] rounded-full"></div>
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">
              {cls.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cls.courseYears.map((cy: any) => (
              <Link
                key={cy.id}
                href={`/course/marks/${cy.id}`}
                className="group rounded-lg p-6 transition-all duration-150 flex flex-col justify-between h-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(217,70%,32%)/0.3] hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="p-2 rounded transition-colors duration-150 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                    >
                      <BookOpen size={20} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold line-clamp-1" title={cy.course.name} style={{ color: "hsl(var(--foreground))" }}>
                    {cy.course.name}
                  </h3>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Users size={14} />
                      <span>{cy.course.instructor.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <GraduationCap size={14} />
                      <span>{cy._count.marks} Graded Students</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-6 text-xs font-medium text-[hsl(var(--primary))]">
                  Enter Marks <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}

            {cls.courseYears.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-[hsl(var(--muted-foreground))] italic">
                No courses assigned to this class yet.
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
