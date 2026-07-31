"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  BookOpen
} from "lucide-react";

interface EnrollmentDetailsClientProps {
  enrollment: {
    id: string;
    studentId: string;
    status: string;
    passStatus: string | null;
    finalGrade: number | null;
    student: { fullName: string | null };
    courseClass: { name: string; year: string } | null;
  };
  courseOfferings: Array<{
    id: string;
    year: string;
    semester: string;
    course: { name: string };
    marks: Array<{ computedScore: number | null; letterGrade: string | null }>;
  }>;
}

export default function EnrollmentDetailsClient({ enrollment, courseOfferings }: EnrollmentDetailsClientProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateStatus = async (passStatus: "PASSED" | "FAILED") => {
    if (!confirm(`Mark student as ${passStatus}? This may trigger automatic enrollment in the next level.`)) return;

    setIsUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/course/enrollments/${enrollment.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      router.refresh();
      alert(`Student marked as ${passStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="flex items-center justify-between">
        <Link href="/course/enrollments" className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} /> Back to Enrollments
        </Link>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--border))] p-8" style={{ background: "hsl(var(--card))" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-500">
              <GraduationCap size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Academic Record</span>
            </div>
            <h1 className="text-3xl font-bold">{enrollment.student.fullName || "Unnamed Student"}</h1>
            <p className="text-lg opacity-60">{enrollment.courseClass?.name} ({enrollment.courseClass?.year})</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Current Year Status</p>
              <span className={`px-4 py-1.5 rounded-full text-sm font-black border uppercase ${
                enrollment.passStatus === "PASSED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                enrollment.passStatus === "FAILED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
              }`}>
                {enrollment.passStatus || "IN PROGRESS"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={16} className="opacity-40" /> Courses Completed
                </h3>
                <div className="space-y-2">
                    {courseOfferings.map(co => (
                        <div key={co.id} className="p-3 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold">{co.course.name}</p>
                                <p className="text-[10px] opacity-40 uppercase font-bold">Sem {co.semester === 'FIRST' ? '1' : '2'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-blue-500">{co.marks[0]?.letterGrade || "-"}</p>
                                <p className="text-[10px] opacity-40">{co.marks[0]?.computedScore?.toFixed(1)}%</p>
                            </div>
                        </div>
                    ))}
                    {courseOfferings.length === 0 && <p className="text-xs italic opacity-40">No course offerings found for this class.</p>}
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-xl p-6 bg-blue-500/5 border border-blue-500/10 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-blue-400">
                        <TrendingUp size={16} /> Progress Management
                    </h3>
                    <p className="text-xs opacity-60 leading-relaxed">
                        Marking the student as "PASSED" for this academic year will automatically enroll them into the next logical class level for the subsequent year.
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            onClick={() => handleUpdateStatus("PASSED")}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all disabled:opacity-50"
                        >
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Mark as Year Passed
                        </button>
                        <button
                            onClick={() => handleUpdateStatus("FAILED")}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all disabled:opacity-50"
                        >
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                            Mark as Year Failed
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20">
                        {error}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
