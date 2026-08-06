import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  User,
  Phone,
  MapPin,
  Edit,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  ClipboardList,
  Bell
} from "lucide-react";
import { formatEthiopianDate } from "@/src/lib/ethiopiancal";
import RecommendButton from "../components/RecommendButton";
import { cookies } from "next/headers";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  WITHDREW: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function CourseStudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('mode_session')?.value;
  let adminId = "";
  if (sessionCookie) {
     try {
       const session = JSON.parse(decodeURIComponent(sessionCookie));
       adminId = session.userId;
     } catch (e) {}
  }

  const student = await prisma.user.findFirst({
    where: {
      OR: [
        { id: id },
        { privateId: id }
      ]
    },
    include: {
      enrollments: {
        include: {
          courseClass: true,
        },
        orderBy: { createdAt: "desc" }
      },
      marks: {
        include: {
          courseYear: {
            include: {
              course: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      attendances: {
        where: {
            event: {
                courseClassId: { not: null }
            }
        },
        include: { event: true, attendanceType: true },
        orderBy: { event: { date: "desc" } },
        take: 10
      }
    }
  });

  if (!student) notFound();

  const isEligibleForAbalat = student.memberTypes.includes("COURSE_STUDENT" as any) &&
                             !student.memberTypes.includes("REGULAR_MEMBER" as any) &&
                             student.enrollments.some(e => ["SALSAY", "RABEAY"].includes(e.courseClass?.name as any));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-6">
      {isEligibleForAbalat && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 animate-slide-in">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600">
                <Bell size={20} />
             </div>
             <div>
                <p className="text-sm font-bold">Promotion Eligible</p>
                <p className="text-xs opacity-60">This student is in Salsay level and can be recommended for Regular Membership.</p>
             </div>
          </div>
          <RecommendButton studentId={student.id} adminId={adminId} />
        </div>
      )}

      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase opacity-40">Abalat ID</p>
            <p className="font-mono font-bold text-lg">{student.privateId || "None"}</p>
          </div>
          <div className="h-10 w-px bg-[hsl(var(--border))] hidden sm:block"></div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase opacity-40">Course ID</p>
            <p className="font-mono font-bold text-lg text-blue-500">{student.coursePrivateId || "None"}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/course/members" className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} /> Back to Students
        </Link>
        <Link
          href={`/course/members/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm font-bold hover:bg-[hsl(var(--accent))] transition-all"
        >
          <Edit size={16} /> Edit Student
        </Link>
        <Link
          href={`/course/members/${id}/grade`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-900/20"
        >
          <GraduationCap size={16} /> Grade All Courses
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] p-6 text-center" style={{ background: "hsl(var(--card))" }}>
            <div className="w-20 h-20 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-4 border-2 border-blue-500/20">
              <User size={40} />
            </div>
            <h2 className="text-xl font-bold">{student.fullName || "Unnamed"}</h2>
            <p className="text-xs opacity-50 uppercase tracking-widest mt-1 font-bold">Course Student</p>
          </div>

          <div className="rounded-2xl border border-[hsl(var(--border))] p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Personal Information</h3>

            <div className="flex items-center gap-3">
              <Phone size={14} className="opacity-40" />
              <div className="min-w-0">
                <p className="text-[10px] opacity-40 uppercase font-bold">Phone</p>
                <p className="text-sm font-medium truncate">{student.phoneNumber || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={14} className="opacity-40" />
              <div className="min-w-0">
                <p className="text-[10px] opacity-40 uppercase font-bold">Address</p>
                <p className="text-sm font-medium truncate">{student.address || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={14} className="opacity-40" />
              <div className="min-w-0">
                <p className="text-[10px] opacity-40 uppercase font-bold">Age</p>
                <p className="text-sm font-medium">{student.age ? `${student.age} years` : "Unknown"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Academic History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrollments */}
          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
              <ClipboardList size={18} className="opacity-50" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Class Enrollments</h3>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {student.enrollments.map((en) => (
                <div key={en.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{en.courseClass?.name || "Unknown Class"}</p>
                    <p className="text-[10px] opacity-40 mt-0.5">Year: {en.courseClass?.year} · Enrolled on {formatEthiopianDate(new Date(en.enrolledDate))}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${statusColors[en.status] || ""}`}>
                    {en.status}
                  </span>
                </div>
              ))}
              {student.enrollments.length === 0 && (
                <div className="p-12 text-center opacity-30 text-sm italic">No class enrollments found.</div>
              )}
            </div>
          </div>

          {/* Grades/Marks */}
          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
              <GraduationCap size={18} className="opacity-50" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Academic Performance</h3>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {student.marks.map((mark) => (
                <div key={mark.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{mark.courseYear.course.name}</p>
                    <p className="text-[10px] opacity-40 mt-0.5">Year: {mark.courseYear.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-500">{mark.letterGrade || "-"}</p>
                    <p className="text-[10px] opacity-40">{mark.computedScore?.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
              {student.marks.length === 0 && (
                <div className="p-12 text-center opacity-30 text-sm italic">No grades recorded yet.</div>
              )}
            </div>
          </div>

          {/* Recent Course Attendance */}
          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
              <CheckCircle2 size={18} className="opacity-50" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Recent Course Attendance</h3>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {student.attendances.map((at) => (
                <div key={at.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{at.event.title}</p>
                    <p className="text-[10px] opacity-40 mt-0.5">{formatEthiopianDate(new Date(at.event.date))}</p>
                  </div>
                  <span className="text-xs font-medium opacity-60">
                    {at.attendanceType.name}
                  </span>
                </div>
              ))}
              {student.attendances.length === 0 && (
                <div className="p-12 text-center opacity-30 text-sm italic">No recent attendance records.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
