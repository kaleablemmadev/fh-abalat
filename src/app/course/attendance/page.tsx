import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { Layers, ArrowRight, Calendar, Users } from "lucide-react";
import { courseClassTypeDisplayNames } from "../constants/courseEnum";

export const dynamic = 'force-dynamic';

export default async function CourseAttendanceDashboard() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  });

  const courseClasses = await prisma.courseClass.findMany({
    where: {
      isActive: true,
      ...(activeYear && { academicYearId: activeYear.id })
    },
    include: {
      _count: {
        select: {
          courseEnrollments: {
            where: { status: "ACTIVE" }
          },
          events: true
        }
      }
    },
    orderBy: [
      { year: "desc" },
      { name: "asc" }
    ]
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            የኮርስ አቴንዳንስ
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {activeYear ? `Active Academic Year: ${activeYear.year}` : "ያቴንዳንስ መዝገቦችን ለመከታተል የኮርስ ዓመት ምረጡ"}
          </p>
        </div>
        <Link
          href="/course/academic-years"
          className="text-xs font-bold px-3 py-1.5 rounded bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] transition-colors"
        >
          ዓመታት ተከታተል
        </Link>
      </div>

      {!activeYear && (
        <div className="rounded-lg border-2 border-dashed p-12 text-center" style={{ borderColor: "hsl(var(--border))" }}>
          <Layers size={32} className="mx-auto mb-3 opacity-20" />
          <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>No active academic year found</h3>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Initialize an academic year to start tracking attendance.</p>
          <Link href="/course/academic-years" className="inline-flex mt-4 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
            የኮርስ ዓመት መዝግብ →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courseClasses.map((c) => (
          <Link
            key={c.id}
            href={`/course/attendance/${c.id}`}
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
                  <Layers size={20} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                  {c.year}
                </span>
              </div>
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {courseClassTypeDisplayNames[c.name] ?? c.name}
              </h2>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Users size={14} />
                  <span>{c._count.courseEnrollments} ተከታታይ ተማሪዎች</span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <Calendar size={14} />
                  <span>{c._count.events} የተመዘገቡ አቴንዳንሶች</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-6 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
              አቴንዳንስ መዝግብ <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}

        {courseClasses.length === 0 && (
          <div className="col-span-full rounded-lg border-2 border-dashed p-12 text-center" style={{ borderColor: "hsl(var(--border))" }}>
            <Layers size={32} className="mx-auto mb-3 opacity-20" />
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>ምንም በክትትል ያሉ ክፍሎች የሉም</h3>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>አቴንዳንስ መመዝገብ ለመጀመር ክፍል በመመሥረቻ ላይ ክፍሎችን መሥርት</p>
            <Link href="/course/course-classes/new" className="inline-flex mt-4 text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
              ክፍል መሥርት →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
