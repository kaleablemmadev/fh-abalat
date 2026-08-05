"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Loader2, CheckCircle2, Calculator } from "lucide-react";
import { calculateFinalMark, getLetterGrade, getPassStatus } from "@/src/lib/courseGrading";

interface Mark {
  id: string;
  midExamScore: number | null;
  assignmentScore: number | null;
  finalExamScore: number | null;
  computedScore: number | null;
  letterGrade: string | null;
  passStatus: string | null;
}

interface Weights {
  attendanceWeight: number;
  midExamWeight: number;
  assignmentWeight: number;
  finalExamWeight: number;
}

interface StudentMarkFormProps {
  courseYearId: string;
  studentId: string;
  initialMark: Mark | null;
  attendanceScore: number;
  weights: Weights;
}

export default function StudentMarkForm({
  courseYearId,
  studentId,
  initialMark,
  attendanceScore,
  weights,
}: StudentMarkFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    midExamScore: initialMark?.midExamScore?.toString() || "",
    assignmentScore: initialMark?.assignmentScore?.toString() || "",
    finalExamScore: initialMark?.finalExamScore?.toString() || "",
  });
  const [computedScore, setComputedScore] = useState<number | null>(initialMark?.computedScore ?? null);
  const [letterGrade, setLetterGrade] = useState<string | null>(initialMark?.letterGrade ?? null);
  const [passStatus, setPassStatus] = useState<string | null>(initialMark?.passStatus ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Recalculate score when form data changes
  useEffect(() => {
    const score = calculateFinalMark(
      {
        midExamScore: formData.midExamScore ? parseFloat(formData.midExamScore) : 0,
        assignmentScore: formData.assignmentScore ? parseFloat(formData.assignmentScore) : 0,
        finalExamScore: formData.finalExamScore ? parseFloat(formData.finalExamScore) : 0,
      },
      weights,
      attendanceScore
    );

    setComputedScore(score);

    // Determine letter grade using shared logic
    const grade = getLetterGrade(score);
    setLetterGrade(grade);
    setPassStatus(getPassStatus(grade));
  }, [formData, weights, attendanceScore]);

  const handleScoreChange = (field: "midExamScore" | "assignmentScore" | "finalExamScore", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const payload = {
        studentId,
        courseYearId,
        midExamScore: formData.midExamScore ? parseFloat(formData.midExamScore) : undefined,
        assignmentScore: formData.assignmentScore ? parseFloat(formData.assignmentScore) : undefined,
        finalExamScore: formData.finalExamScore ? parseFloat(formData.finalExamScore) : undefined,
      };

      const res = await fetch(`/api/course/marks`, {
        method: "POST", // The API uses POST with studentId/courseYearId to findUnique/create/update
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save mark");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "text-zinc-400";
    if (grade.startsWith("A")) return "text-emerald-400";
    if (grade.startsWith("B")) return "text-sky-400";
    if (grade.startsWith("C")) return "text-amber-400";
    if (grade === "F") return "text-red-400";
    return "text-zinc-400";
  };

  const getPassStatusColor = (status: string | null) => {
    if (status === "PASSED") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "FAILED") return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  };

  const hasChanges = () => {
    const initialMidExam = initialMark?.midExamScore?.toString() || "";
    const initialAssignment = initialMark?.assignmentScore?.toString() || "";
    const initialFinalExam = initialMark?.finalExamScore?.toString() || "";

    return (
      formData.midExamScore !== initialMidExam ||
      formData.assignmentScore !== initialAssignment ||
      formData.finalExamScore !== initialFinalExam
    );
  };

  return (
    <div className="space-y-4">
      {/* Weights Info */}
      <div
        className="rounded-lg p-3 text-[10px] flex flex-wrap gap-x-4 gap-y-1"
        style={{
          background: "hsl(var(--muted))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div className="flex items-center gap-1.5">
          <Calculator size={12} className="opacity-50" />
          <span className="font-bold uppercase tracking-wider opacity-50">Weights:</span>
        </div>
        <span style={{ color: "hsl(var(--muted-foreground))" }}>Attendance: {weights.attendanceWeight}%</span>
        <span style={{ color: "hsl(var(--muted-foreground))" }}>Mid Exam: {weights.midExamWeight}%</span>
        <span style={{ color: "hsl(var(--muted-foreground))" }}>Assignment: {weights.assignmentWeight}%</span>
        <span style={{ color: "hsl(var(--muted-foreground))" }}>Final Exam: {weights.finalExamWeight}%</span>
      </div>

      {/* Form */}
      <div
        className="rounded-lg p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">
              Attendance ({weights.attendanceWeight})
            </label>
            <div
              className="h-9 w-full rounded border px-3 text-xs flex items-center bg-zinc-900/50"
              style={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {attendanceScore.toFixed(1)}
              <span className="ml-1 text-[9px] opacity-40">(Read-only)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">
              Mid Exam ({weights.midExamWeight})
            </label>
            <input
              className="h-9 w-full rounded border px-3 text-xs transition-all duration-150"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              type="number"
              min="0"
              max={weights.midExamWeight}
              step="0.1"
              value={formData.midExamScore}
              onChange={(e) => handleScoreChange("midExamScore", e.target.value)}
              placeholder={`0-${weights.midExamWeight}`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">
              Assignment ({weights.assignmentWeight})
            </label>
            <input
              className="h-9 w-full rounded border px-3 text-xs transition-all duration-150"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              type="number"
              min="0"
              max={weights.assignmentWeight}
              step="0.1"
              value={formData.assignmentScore}
              onChange={(e) => handleScoreChange("assignmentScore", e.target.value)}
              placeholder={`0-${weights.assignmentWeight}`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">
              Final Exam ({weights.finalExamWeight})
            </label>
            <input
              className="h-9 w-full rounded border px-3 text-xs transition-all duration-150"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              type="number"
              min="0"
              max={weights.finalExamWeight}
              step="0.1"
              value={formData.finalExamScore}
              onChange={(e) => handleScoreChange("finalExamScore", e.target.value)}
              placeholder={`0-${weights.finalExamWeight}`}
            />
          </div>
        </div>

        {/* Computed Results */}
        <div
          className="mt-6 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            background: "hsl(var(--muted) / 0.5)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">
                Computed Score
              </p>
              <p className="text-xl font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {computedScore !== null ? computedScore.toFixed(1) : "-"}
                <span className="text-xs font-normal opacity-40 ml-1">/ 100</span>
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">
                Letter Grade
              </p>
              <p className={`text-xl font-black ${getGradeColor(letterGrade)}`}>
                {letterGrade || "-"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {passStatus && (
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getPassStatusColor(
                  passStatus
                )}`}
              >
                {passStatus}
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges()}
                className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-bold transition-all duration-150"
                style={{
                  background: isSaving || !hasChanges() ? "hsl(217 70% 25%)" : "hsl(217 70% 35%)",
                  color: "#fff",
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Grades
                  </>
                )}
              </button>

              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-bold transition-all duration-150"
                style={{
                  background: "hsl(var(--muted))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>

        {saveStatus === "success" && (
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-400 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 size={14} />
            Marks saved successfully
          </div>
        )}
        {saveStatus === "error" && (
          <div className="mt-4 text-xs font-medium text-red-400">
            Failed to save marks. Please check your connection and try again.
          </div>
        )}
      </div>
    </div>
  );
}
