"use client";

import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Loader2, Save, Users, Filter, Calculator, Trophy } from "lucide-react";
import { calculateFinalMark, getLetterGrade, getPassStatus } from "@/src/lib/courseGrading";

interface Student {
  id: string;
  fullName: string | null;
}

interface Mark {
  id: string;
  midExamScore: number | null;
  assignmentScore: number | null;
  finalExamScore: number | null;
  computedScore: number | null;
  letterGrade: string | null;
  passStatus: string | null;
}

interface StudentWithData {
  student: Student;
  mark: Mark | null;
  attendanceScore: number;
}

interface Weights {
  attendanceWeight: number;
  midExamWeight: number;
  assignmentWeight: number;
  finalExamWeight: number;
}

interface BulkGradingGridProps {
  courseYearId: string;
  studentsWithData: StudentWithData[];
  weights: Weights;
}

export default function BulkGradingGrid({
  courseYearId,
  studentsWithData,
  weights,
}: BulkGradingGridProps) {
  // State: Record<studentId, { midExamScore, assignmentScore, finalExamScore }>
  const [marksState, setMarksState] = useState<
    Record<string, { midExamScore: string; assignmentScore: string; finalExamScore: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [filter, setFilter] = useState<"all" | "passed" | "failed">("all");

  // Initialize state from existing marks
  useEffect(() => {
    const initialState: Record<
      string,
      { midExamScore: string; assignmentScore: string; finalExamScore: string }
    > = {};

    studentsWithData.forEach(({ student, mark }) => {
      initialState[student.id] = {
        midExamScore: mark?.midExamScore?.toString() || "",
        assignmentScore: mark?.assignmentScore?.toString() || "",
        finalExamScore: mark?.finalExamScore?.toString() || "",
      };
    });

    setMarksState(initialState);
  }, [studentsWithData]);

  const handleScoreChange = (
    studentId: string,
    field: "midExamScore" | "assignmentScore" | "finalExamScore",
    value: string
  ) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Convert state to API format
      const marksUpdate = Object.entries(marksState).map(([studentId, scores]) => ({
        studentId,
        midExamScore: scores.midExamScore ? parseFloat(scores.midExamScore) : undefined,
        assignmentScore: scores.assignmentScore ? parseFloat(scores.assignmentScore) : undefined,
        finalExamScore: scores.finalExamScore ? parseFloat(scores.finalExamScore) : undefined,
      }));

      const res = await fetch(`/api/course/marks/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseYearId,
          marks: marksUpdate,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save marks");
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

  const hasChanges = () => {
    const initialState: Record<
      string,
      { midExamScore: string; assignmentScore: string; finalExamScore: string }
    > = {};
    studentsWithData.forEach(({ student, mark }) => {
      initialState[student.id] = {
        midExamScore: mark?.midExamScore?.toString() || "",
        assignmentScore: mark?.assignmentScore?.toString() || "",
        finalExamScore: mark?.finalExamScore?.toString() || "",
      };
    });

    return JSON.stringify(marksState) !== JSON.stringify(initialState);
  };

  const getGradeColor = (letterGrade: string | null) => {
    if (!letterGrade) return "text-zinc-400";
    if (letterGrade.startsWith("A")) return "text-emerald-400";
    if (letterGrade.startsWith("B")) return "text-sky-400";
    if (letterGrade.startsWith("C")) return "text-amber-400";
    return "text-zinc-400";
  };

  const getPassStatusColor = (passStatus: string | null) => {
    if (passStatus === "PASSED") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (passStatus === "FAILED") return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  };

  // Filter students based on pass status
  const filteredStudents = useMemo(() => {
    return studentsWithData.filter(({ mark }) => {
      if (filter === "all") return true;
      if (filter === "passed") return mark?.passStatus === "PASSED";
      if (filter === "failed") return mark?.passStatus === "FAILED";
      return true;
    });
  }, [studentsWithData, filter]);

  // Calculate real-time rankings for this specific course
  const rankedStudents = useMemo(() => {
    const computed = filteredStudents.map(item => {
      const state = marksState[item.student.id] || { midExamScore: "", assignmentScore: "", finalExamScore: "" };
      const score = calculateFinalMark(
        {
          midExamScore: state.midExamScore ? parseFloat(state.midExamScore) : 0,
          assignmentScore: state.assignmentScore ? parseFloat(state.assignmentScore) : 0,
          finalExamScore: state.finalExamScore ? parseFloat(state.finalExamScore) : 0,
        },
        weights,
        item.attendanceScore
      );
      return { ...item, realTimeScore: score };
    });

    // Sort by score descending
    const sorted = [...computed].sort((a, b) => b.realTimeScore - a.realTimeScore);

    // Assign ranks (handling ties if we want, but simple for now)
    return computed.map(item => {
      const rank = sorted.findIndex(s => s.student.id === item.student.id) + 1;
      return { ...item, rank };
    });
  }, [filteredStudents, marksState, weights]);

  const totals = useMemo(() => ({
    total: studentsWithData.length,
    passed: studentsWithData.filter(({ mark }) => mark?.passStatus === "PASSED").length,
    failed: studentsWithData.filter(({ mark }) => mark?.passStatus === "FAILED").length,
  }), [studentsWithData]);

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div
        className="rounded-lg p-3 flex items-center justify-between gap-3"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div className="flex items-center gap-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              {totals.total}
            </span>
            <span>students</span>
          </div>

          <span style={{ color: "hsl(var(--border))" }}>|</span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(160 55% 55%)" }}>
              {totals.passed}
            </span>{" "}
            passed
          </span>

          <span>
            <span className="font-semibold" style={{ color: "hsl(0 55% 55%)" }}>
              {totals.failed}
            </span>{" "}
            failed
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          <select
            className="h-7 rounded border px-2 text-xs appearance-none transition-all duration-150"
            style={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "passed" | "failed")}
          >
            <option value="all">All students</option>
            <option value="passed">Passed only</option>
            <option value="failed">Failed only</option>
          </select>
        </div>
      </div>

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

      {/* Grading Grid */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  background: "hsl(var(--muted))",
                  borderBottom: "1px solid hsl(var(--border))",
                }}
              >
                <th
                  className="sticky left-0 px-3 py-2 text-left font-semibold z-10"
                  style={{
                    background: "hsl(var(--muted))",
                    color: "hsl(var(--foreground))",
                    minWidth: "150px",
                  }}
                >
                  Student
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: "hsl(var(--foreground))", minWidth: "60px" }}
                >
                  Att ({weights.attendanceWeight})
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: "hsl(var(--foreground))", minWidth: "80px" }}
                >
                  Mid ({weights.midExamWeight})
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: "hsl(var(--foreground))", minWidth: "80px" }}
                >
                  Assign ({weights.assignmentWeight})
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: "hsl(var(--foreground))", minWidth: "80px" }}
                >
                  Final ({weights.finalExamWeight})
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: "hsl(var(--foreground))", minWidth: "60px" }}
                >
                  Rank
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: "hsl(var(--foreground))", minWidth: "60px" }}
                >
                  Grade
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: "hsl(var(--foreground))", minWidth: "70px" }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rankedStudents.map(({ student, mark, attendanceScore, rank, realTimeScore }) => {
                const current = marksState[student.id] || {
                  midExamScore: "",
                  assignmentScore: "",
                  finalExamScore: "",
                };

                const grade = getLetterGrade(realTimeScore);
                const status = getPassStatus(grade);

                return (
                  <tr key={student.id} style={{ borderBottom: "1px solid hsl(var(--border))" }} className="group">
                    <td
                      className="sticky left-0 px-3 py-2 z-10"
                      style={{
                        background: "hsl(var(--card))",
                        color: "hsl(var(--foreground))",
                        minWidth: "150px",
                      }}
                    >
                      {student.fullName || "Unnamed student"}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="text-zinc-500 font-medium">
                        {attendanceScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-16 h-7 rounded border px-2 text-xs text-center transition-all duration-150"
                        style={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                        type="number"
                        min="0"
                        max={weights.midExamWeight}
                        step="0.1"
                        value={current.midExamScore}
                        onChange={(e) => handleScoreChange(student.id, "midExamScore", e.target.value)}
                        placeholder={`0-${weights.midExamWeight}`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-16 h-7 rounded border px-2 text-xs text-center transition-all duration-150"
                        style={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                        type="number"
                        min="0"
                        max={weights.assignmentWeight}
                        step="0.1"
                        value={current.assignmentScore}
                        onChange={(e) => handleScoreChange(student.id, "assignmentScore", e.target.value)}
                        placeholder={`0-${weights.assignmentWeight}`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-16 h-7 rounded border px-2 text-xs text-center transition-all duration-150"
                        style={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--foreground))",
                        }}
                        type="number"
                        min="0"
                        max={weights.finalExamWeight}
                        step="0.1"
                        value={current.finalExamScore}
                        onChange={(e) => handleScoreChange(student.id, "finalExamScore", e.target.value)}
                        placeholder={`0-${weights.finalExamWeight}`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center" style={{ color: "hsl(var(--foreground))" }}>
                      <span className="font-bold text-blue-500">
                        {realTimeScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                        rank === 2 ? 'bg-slate-300/20 text-slate-400' :
                        rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        {rank}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`font-black ${getGradeColor(grade)}`}>
                        {grade}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPassStatusColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div
        className="sticky bottom-4 rounded-lg p-3 flex items-center justify-between gap-3"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          <Users size={14} />
          <span>{filteredStudents.length} students shown</span>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === "success" && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(160 65% 60%)" }}>
              <CheckCircle2 size={14} />
              Saved
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(0 55% 60%)" }}>
              Failed to save
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold transition-colors duration-150"
            style={{
              background: isSaving || !hasChanges() ? "hsl(200 70% 25%)" : "hsl(200 70% 32%)",
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              if (!isSaving && hasChanges()) {
                e.currentTarget.style.background = "hsl(200 70% 38%)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving && hasChanges()) {
                e.currentTarget.style.background = "hsl(200 70% 32%)";
              }
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={12} />
                Save Marks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
