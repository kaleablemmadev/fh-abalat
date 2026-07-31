"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Loader2, CalendarDays, Calculator } from "lucide-react";

interface CourseYearFormProps {
  initialData?: {
    id?: string;
    courseId?: string;
    courseClassId?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    semester?: string;
    isTwoSemesters?: boolean;
    attendanceWeight?: number;
    midExamWeight?: number;
    assignmentWeight?: number;
    finalExamWeight?: number;
  };
  isEditMode?: boolean;
  courses: Array<{
    id: string;
    name: string;
  }>;
  courseClasses: Array<{
    id: string;
    name: string;
    year: string;
  }>;
}

const fieldBase = {
  className: "h-9 w-full rounded border px-3 text-sm transition-all duration-150 appearance-none",
  style: {
    background: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
  },
};

export default function CourseYearForm({
  initialData,
  isEditMode = false,
  courses,
  courseClasses,
}: CourseYearFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    courseId: initialData?.courseId || "",
    courseClassId: initialData?.courseClassId || "",
    year: initialData?.year || new Date().getFullYear().toString(),
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    semester: initialData?.semester || "FIRST",
    isTwoSemesters: initialData?.isTwoSemesters || false,
    attendanceWeight: initialData?.attendanceWeight || 10,
    midExamWeight: initialData?.midExamWeight || 25,
    assignmentWeight: initialData?.assignmentWeight || 15,
    finalExamWeight: initialData?.finalExamWeight || 50,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weightSum =
    formData.attendanceWeight +
    formData.midExamWeight +
    formData.assignmentWeight +
    formData.finalExamWeight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (Math.abs(weightSum - 100) > 0.01) {
      setError("Assessment weights must sum to exactly 100");
      setIsLoading(false);
      return;
    }

    try {
      const url = isEditMode ? `/api/course/course-years/${initialData?.id}` : "/api/course/course-years";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save course year");
      }

      router.push("/course/course-years");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course year");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in max-w-lg">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          {isEditMode ? "Edit Course Year" : "New Course Year"}
        </h2>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {isEditMode ? "Update course configuration." : "Assign a course to a class for a specific year."}
        </p>
      </div>

      <div
        className="rounded-lg p-4 space-y-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays size={14} className="opacity-50" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Assignment Details</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Course *
            </label>
            <select
              {...fieldBase}
              value={formData.courseId}
              onChange={(e) => handleChange("courseId", e.target.value)}
              required
              disabled={isEditMode}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Course Class *
            </label>
            <select
              {...fieldBase}
              value={formData.courseClassId}
              onChange={(e) => handleChange("courseClassId", e.target.value)}
              required
              disabled={isEditMode}
            >
              <option value="">Select class</option>
              {courseClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Academic Year *
            </label>
            <input
              {...fieldBase}
              type="text"
              value={formData.year}
              onChange={(e) => handleChange("year", e.target.value)}
              placeholder="e.g., 2017"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Semester *
            </label>
            <select
              {...fieldBase}
              value={formData.semester}
              onChange={(e) => handleChange("semester", e.target.value)}
              required
            >
              <option value="FIRST">1st Semester</option>
              <option value="SECOND">2nd Semester</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id="isTwoSemesters"
            className="rounded"
            style={{ accentColor: "hsl(217 70% 32%)" }}
            checked={formData.isTwoSemesters}
            onChange={(e) => handleChange("isTwoSemesters", e.target.checked)}
          />
          <label htmlFor="isTwoSemesters" className="text-xs font-medium cursor-pointer">
            This course spans both semesters
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Term Start Date *
            </label>
            <input
              {...fieldBase}
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Term End Date *
            </label>
            <input
              {...fieldBase}
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator size={14} className="opacity-50" />
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Assessment Weights</p>
            </div>
            <span
              className={`text-xs font-bold ${
                Math.abs(weightSum - 100) < 0.01 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              Total: {weightSum}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Attendance</label>
              <input
                {...fieldBase}
                type="number"
                min="0"
                max="100"
                value={formData.attendanceWeight}
                onChange={(e) => handleChange("attendanceWeight", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Mid Exam</label>
              <input
                {...fieldBase}
                type="number"
                min="0"
                max="100"
                value={formData.midExamWeight}
                onChange={(e) => handleChange("midExamWeight", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Assignment</label>
              <input
                {...fieldBase}
                type="number"
                min="0"
                max="100"
                value={formData.assignmentWeight}
                onChange={(e) => handleChange("assignmentWeight", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Final Exam</label>
              <input
                {...fieldBase}
                type="number"
                min="0"
                max="100"
                value={formData.finalExamWeight}
                onChange={(e) => handleChange("finalExamWeight", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="rounded p-3 text-sm font-medium animate-slide-in"
          style={{
            background: "hsl(0 40% 10%)",
            border: "1px solid hsl(0 40% 22%)",
            color: "hsl(0 55% 62%)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150 border"
          style={{
            background: "transparent",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
          style={{
            background: "hsl(217 70% 32%)",
            color: "#fff",
          }}
        >
          {isLoading && <Loader2 size={13} className="animate-spin" />}
          {isLoading ? "Saving…" : isEditMode ? "Save Changes" : "Create Course Year"}
        </button>
      </div>
    </form>
  );
}
