import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { Shield, ArrowRight, Layers, Users, CheckCircle2 } from "lucide-react";

export default async function CourseEligibilityDashboard() {
  const courseClasses = await prisma.courseClass.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          courseEnrollments: {
            where: { status: "ACTIVE" }
          },
          events: {
            where: { eligibilityRuleId: { not: null } }
          }
        }
      },
      events: {
        where: { eligibilityRuleId: { not: null } },
        include: { eligibilityRule: true },
        take: 1,
        orderBy: { date: "desc" }
      }
    },
    orderBy: [
      { year: "desc" },
      { name: "asc" }
    ]
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          Student Eligibility
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Track and manage student eligibility for course exams and activities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courseClasses.map((c) => {
          const latestRule = c.events[0]?.eligibilityRule;

          return (
            <Link
              key={c.id}
              href={`/course/attendance/${c.id}`} // Links to attendance for now, should eventually link to a report
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
                      background: "hsl(160 40% 12%)",
                      color: "hsl(160 60% 55%)",
                    }}
                  >
                    <Shield size={20} />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                    {c.year}
                  </span>
                </div>
                <h2 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>
                  {c.name}
                </h2>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Users size={14} />
                    <span>{c._count.courseEnrollments} Active Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <CheckCircle2 size={14} />
                    <span>{latestRule ? `Rule: ${latestRule.name}` : "No rule applied"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 mt-6 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                View Eligibility <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}

        {courseClasses.length === 0 && (
          <div className="col-span-full rounded-lg border-2 border-dashed p-12 text-center" style={{ borderColor: "hsl(var(--border))" }}>
            <Layers size={32} className="mx-auto mb-3 opacity-20" />
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>No active classes found</h3>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Create a class to manage eligibility.</p>
          </div>
        )}
      </div>
    </div>
  );
}
