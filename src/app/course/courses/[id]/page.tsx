import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import Breadcrumb from "@/src/components/navigation/Breadcrumb";
import { BookOpen, User, Layers, Calendar, CheckSquare, GraduationCap, ArrowLeft, Clock, FileText, Download } from "lucide-react";
import Link from "next/link";

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: true,
      department: true,
      courseYears: {
        include: {
          courseClass: true,
          _count: {
            select: { marks: true }
          }
        },
        orderBy: { year: "desc" }
      }
    }
  });

  if (!course) notFound();

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <Breadcrumb
        items={[
          { label: 'Courses', href: '/course/courses' },
          { label: course.name },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-2 py-0.5 rounded-md w-fit">
            <BookOpen size={12} />
            <span>Course Details</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">{course.name}</h1>
          <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-[hsl(var(--primary))]" />
              <span className="font-medium">{course.instructor.fullName}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Layers size={14} className="text-[hsl(var(--primary))]" />
              <span className="font-medium">{course.department.name}</span>
            </div>
          </div>
        </div>

        <Link
          href={`/course/courses/${id}/edit`}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all border border-[hsl(var(--border))]"
        >
          Edit Course Information
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock size={18} className="text-[hsl(var(--primary))]" />
              Description
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              {course.description || "No description provided for this course."}
            </p>
          </div>

          {/* Handouts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                Teacher Handout
              </h3>
              {course.teacherHandoutUrl ? (
                <a
                  href={course.teacherHandoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Download size={14} /> Download PDF
                </a>
              ) : (
                <p className="text-xs text-[hsl(var(--muted-foreground))] italic">No handout uploaded.</p>
              )}
            </div>

            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText size={16} className="text-emerald-500" />
                Student Handout
              </h3>
              {course.studentHandoutUrl ? (
                <a
                  href={course.studentHandoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Download size={14} /> Download PDF
                </a>
              ) : (
                <p className="text-xs text-[hsl(var(--muted-foreground))] italic">No handout uploaded.</p>
              )}
            </div>
          </div>

          {/* Topics */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckSquare size={18} className="text-[hsl(var(--primary))]" />
              Syllabus Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {course.topics.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] italic">No topics listed.</p>
              ) : (
                course.topics.map((topic, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-[hsl(var(--muted))] text-xs font-medium border border-[hsl(var(--border))]">
                    {topic}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Offerings History */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted)/0.3)]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <Calendar size={16} />
                Course Offerings History
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                {course.courseYears.length} Terms
              </span>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {course.courseYears.length === 0 ? (
                <div className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))] italic">
                  This course hasn't been assigned to any academic years yet.
                </div>
              ) : (
                course.courseYears.map((cy) => (
                  <div key={cy.id} className="p-5 flex items-center justify-between hover:bg-[hsl(var(--muted)/0.2)] transition-colors group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[hsl(var(--foreground))]">{cy.courseClass.name}</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">— {cy.year} ({cy.semester})</span>
                      </div>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {new Date(cy.startDate).toLocaleDateString()} – {new Date(cy.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-bold text-[hsl(var(--foreground))]">{cy._count.marks}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">Students</p>
                      </div>
                      <Link
                        href={`/course/marks/${cy.id}`}
                        className="p-2 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary)/0.1)] transition-all"
                      >
                        <GraduationCap size={18} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Total Credits</span>
                <span className="text-sm font-bold">{course.credits || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Permanent Classes</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                  {course.classTypes.map((type: string) => (
                    <span key={type} className="text-[10px] font-bold text-[hsl(var(--primary))] uppercase tracking-tighter bg-[hsl(var(--primary)/0.05)] px-1 rounded">{type}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${course.isGiven ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                  {course.isGiven ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Dept Code</span>
                <span className="text-sm font-mono font-bold text-[hsl(var(--primary))]">{course.department.code || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[hsl(217_70%_32%)] p-6 text-white space-y-4 shadow-lg shadow-[hsl(217_70%_32%)/0.2]">
            <h3 className="font-bold flex items-center gap-2">
              <User size={18} />
              Instructor Details
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-bold">{course.instructor.fullName}</p>
              <p className="text-xs text-blue-100 opacity-80">{course.instructor.email || "No email provided"}</p>
            </div>
            <button className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-all border border-white/10">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
