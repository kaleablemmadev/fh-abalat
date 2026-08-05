"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle2, ArrowLeft, Calculator, GraduationCap, Target } from "lucide-react";
import { calculateFinalMark, getLetterGrade, getPassStatus } from "@/src/lib/courseGrading";

interface CourseMarkData {
  courseYearId: string;
  courseName: string;
  weights: {
    attendanceWeight: number;
    midExamWeight: number;
    assignmentWeight: number;
    finalExamWeight: number;
  };
  currentMark: {
    midExamScore: number | null;
    assignmentScore: number | null;
    finalExamScore: number | null;
  } | null;
  currentRank: number | null;
  weightedAttendance: number;
  isGradingComplete: boolean;
}

interface StudentAllMarksFormProps {
  studentId: string;
  studentName: string;
  attendanceScore?: number;
  courses: CourseMarkData[];
}

export default function StudentAllMarksForm({
  studentId,
  studentName,
  attendanceScore,
  courses,
}: StudentAllMarksFormProps) {
  const router = useRouter();

  // State: Record<courseYearId, { mid, assignment, final }>
  const [marksState, setMarksState] = useState<Record<string, { mid: string; assignment: string; final: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const initialState: Record<string, { mid: string; assignment: string; final: string }> = {};
    courses.forEach(c => {
      initialState[c.courseYearId] = {
        mid: c.currentMark?.midExamScore?.toString() || "",
        assignment: c.currentMark?.assignmentScore?.toString() || "",
        final: c.currentMark?.finalExamScore?.toString() || "",
      };
    });
    setMarksState(initialState);
  }, [courses]);

  const handleScoreChange = (courseYearId: string, field: "mid" | "assignment" | "final", value: string) => {
    setMarksState(prev => ({
      ...prev,
      [courseYearId]: { ...prev[courseYearId], [field]: value }
    }));
  };

  const computedData = useMemo(() => {
    return courses.map(c => {
      const state = marksState[c.courseYearId] || { mid: "", assignment: "", final: "" };
      const score = calculateFinalMark(
        {
          midExamScore: state.mid ? parseFloat(state.mid) : 0,
          assignmentScore: state.assignment ? parseFloat(state.assignment) : 0,
          finalExamScore: state.final ? parseFloat(state.final) : 0,
        },
        c.weights,
        c.weightedAttendance
      );
      const grade = getLetterGrade(score);
      return {
        courseYearId: c.courseYearId,
        score,
        grade,
        status: getPassStatus(grade)
      };
    });
  }, [marksState, courses]);

  const averageScore = useMemo(() => {
    const completed = computedData.filter(d => {
      const course = courses.find(c => c.courseYearId === d.courseYearId);
      return course?.isGradingComplete;
    });
    if (completed.length === 0) return 0;
    return completed.reduce((sum, d) => sum + d.score, 0) / completed.length;
  }, [computedData, courses]);

  const overallPass = averageScore >= 50;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = Object.entries(marksState).map(([id, s]) => ({
        courseYearId: id,
        midExamScore: s.mid ? parseFloat(s.mid) : undefined,
        assignmentScore: s.assignment ? parseFloat(s.assignment) : undefined,
        finalExamScore: s.final ? parseFloat(s.final) : undefined,
      }));

      const res = await fetch(`/api/course/members/${studentId}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: payload }),
      });

      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
      router.refresh();
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] transition-colors border border-[hsl(var(--border))]">
                <ArrowLeft size={18} />
            </button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{studentName}</h1>
                <p className="text-sm opacity-50 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <GraduationCap size={14} /> Full Academic Record
                </p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-6 py-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-right">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Average Score</p>
                <p className="text-2xl font-black text-white">{averageScore.toFixed(1)}%</p>
            </div>
            <div className={`px-6 py-3 rounded-2xl border ${overallPass ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} text-right`}>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</p>
                <p className={`text-2xl font-black ${overallPass ? 'text-emerald-500' : 'text-red-500'}`}>{overallPass ? 'PASSED' : 'FAILED'}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {courses.map((c) => {
          const comp = computedData.find(d => d.courseYearId === c.courseYearId)!;
          const state = marksState[c.courseYearId] || { mid: "", assignment: "", final: "" };

          return (
            <div key={c.courseYearId} className={`bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm group hover:border-blue-500/30 transition-colors ${!c.isGradingComplete ? 'opacity-70 grayscale-[0.5]' : ''}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white truncate">{c.courseName}</h3>
                    {!c.isGradingComplete && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase border border-amber-500/20">
                        In Progress
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold opacity-40 uppercase tracking-widest">Weights: Mid {c.weights.midExamWeight}% · Final {c.weights.finalExamWeight}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold opacity-40 uppercase tracking-widest px-1">Attendance ({c.weights.attendanceWeight})</label>
                    <div className="h-10 w-24 rounded-lg bg-zinc-900/50 border border-[hsl(var(--border))] flex items-center justify-center text-sm font-bold text-zinc-500">
                        {c.weightedAttendance.toFixed(1)}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold opacity-40 uppercase tracking-widest px-1 text-blue-500">Mid Exam ({c.weights.midExamWeight})</label>
                    <input
                      type="number"
                      className="h-10 w-24 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-center text-sm font-bold focus:border-blue-500 outline-none transition-all"
                      value={state.mid}
                      onChange={e => handleScoreChange(c.courseYearId, "mid", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold opacity-40 uppercase tracking-widest px-1 text-blue-500">Assign ({c.weights.assignmentWeight})</label>
                    <input
                      type="number"
                      className="h-10 w-24 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-center text-sm font-bold focus:border-blue-500 outline-none transition-all"
                      value={state.assignment}
                      onChange={e => handleScoreChange(c.courseYearId, "assignment", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold opacity-40 uppercase tracking-widest px-1 text-blue-500">Final ({c.weights.finalExamWeight})</label>
                    <input
                      type="number"
                      className="h-10 w-24 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-center text-sm font-bold focus:border-blue-500 outline-none transition-all"
                      value={state.final}
                      onChange={e => handleScoreChange(c.courseYearId, "final", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pl-6 lg:border-l border-[hsl(var(--border))] flex-shrink-0">
                  <div className="text-center">
                    <p className="text-[9px] font-bold opacity-40 uppercase mb-1">Rank</p>
                    <p className={`text-xl font-black ${c.currentRank === 1 ? 'text-yellow-500' : 'text-zinc-500'}`}>
                        {c.currentRank || "-"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold opacity-40 uppercase mb-1">Score</p>
                    <p className="text-xl font-bold text-blue-500">{comp.score.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold opacity-40 uppercase mb-1">Grade</p>
                    <p className={`text-xl font-black ${comp.score >= 50 ? 'text-white' : 'text-red-500'}`}>{comp.grade}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${comp.score >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {comp.score >= 50 ? <CheckCircle2 size={20} /> : <Target size={20} className="opacity-40" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-8 flex justify-center pt-8 border-t border-[hsl(var(--border))] pointer-events-none">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="pointer-events-auto inline-flex items-center gap-3 px-12 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-xl shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-30"
        >
          {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
          {isSaving ? "Saving Report Card..." : "Save Student Report"}
        </button>
      </div>

      {saveStatus === "success" && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-emerald-600 text-white font-bold shadow-lg animate-slide-up flex items-center gap-2">
            <CheckCircle2 size={20} /> Changes Saved Successfully
        </div>
      )}
    </div>
  );
}
