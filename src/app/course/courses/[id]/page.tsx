import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import Breadcrumb from "@/src/components/navigation/Breadcrumb";
import { BookOpen, User, Layers, Calendar, CheckSquare, GraduationCap, ArrowLeft, Clock, FileText, Download } from "lucide-react";
import Link from "next/link";
import { formatEthiopianDate } from "@/src/lib/ethiopiancal";

import CourseOfferingActions from "../components/CourseOfferingActions";

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
          instructor: true,
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

          <div className="rounded-2xl bg-[hsl(217_70%_32%)] p-6 text-white space-y-4 shadow-lg shadow-[hsl(217_70%_32%)/0.2]">
            <h3 className="font-bold flex items-center gap-2">
              <User size={18} />
              Primary Instructor
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-bold">{course.instructor.fullName}</p>
              <p className="text-xs text-blue-100 opacity-80">{course.instructor.email || "No email provided"}</p>
            </div>
            <p className="text-[10px] text-blue-200 opacity-60 leading-relaxed italic">
                * This is the default instructor assigned when creating new academic years. You can swap instructors for specific years in the Year Management tool.
            </p>
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
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
                >
                  <Download size={14} /> Download Teacher PDF
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
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                >
                  <Download size={14} /> Download Student PDF
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

          {/* Offerings History with Link to Grading */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted)/0.3)]">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <Calendar size={16} />
                Course Performance Access
              </h2>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {course.courseYears.map((cy) => (
                <div key={cy.id} className="p-5 flex items-center justify-between hover:bg-[hsl(var(--muted)/0.2)] transition-colors group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[hsl(var(--foreground))]">{cy.courseClass.name}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">— {cy.year} ({cy.semester})</span>
                    </div>
                    <p className="text-[10px] text-[hsl(var(--primary))] font-bold uppercase tracking-tight">
                       Instructor: {cy.instructor?.fullName || "Default Instructor"}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      Current student count: {cy._count.marks}
                    </p>
                  </div>
                  <Link
                    href={`/course/marks/${cy.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-900/20"
                  >
                    Open Bulk Grading <ArrowLeft size={14} className="rotate-180" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[hsl(217_70%_32%)] p-6 text-white space-y-4 shadow-lg shadow-[hsl(217_70%_32%)/0.2]">
            <h3 className="font-bold flex items-center gap-2">
              <User size={18} />
              Primary Instructor
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-bold">{course.instructor.fullName}</p>
              <p className="text-xs text-blue-100 opacity-80">{course.instructor.email || "No email provided"}</p>
            </div>
            <p className="text-[10px] text-blue-200 opacity-60 leading-relaxed italic">
                * This is the default instructor assigned when creating new academic years. You can swap instructors for specific years in the Year Management tool.
            </p>
          </div>
        </div>

        {/* Sidebar: Actions & Info */}
        <div className="space-y-6">
          <CourseOfferingActions
            courseId={course.id}
            courseName={course.name}
            courseYears={course.courseYears}
          />

          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Total Credits</span>
                <span className="text-sm font-bold">{course.credits || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Weights</span>
                <div className="text-right">
                  <p className="text-[10px] font-bold">Mid {course.midExamWeight}%</p>
                  <p className="text-[10px] font-bold">Final {course.finalExamWeight}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${course.isGiven ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                  {course.isGiven ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[hsl(217_70%_32%)] p-6 text-white space-y-4 shadow-lg shadow-[hsl(217_70%_32%)/0.2]">
            <h3 className="font-bold flex items-center gap-2">
              <User size={18} />
              Primary Instructor
            </h3>
            <div className="space-y-1">
              <p className="text-lg font-bold">{course.instructor.fullName}</p>
              <p className="text-xs text-blue-100 opacity-80">{course.instructor.email || "No email provided"}</p>
            </div>
            <p className="text-[10px] text-blue-200 opacity-60 leading-relaxed italic">
                * This is the default instructor assigned when creating new academic years. You can swap instructors for specific years in the Year Management tool.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
