// /course/enrollments/components/EnrollmentForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { enrollmentStatusValues } from "../../constants/courseEnum";

interface EnrollmentFormProps {
  initialData?: {
    id?: string;
    studentId?: string;
    courseClassId?: string;
    status?: string;
    enrolledDate?: string;
    unenrollmentDate?: string;
    unenrollmentReason?: string;
  };
  isEditMode?: boolean;
  courseClasses: Array<{
    id: string;
    name: string;
    year: string;
  }>;
  students: Array<{
    id: string;
    fullName: string | null;
  }>;
}

export default function EnrollmentForm({ 
  initialData, 
  isEditMode = false, 
  courseClasses,
  students 
}: EnrollmentFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentId: initialData?.studentId || "",
    courseClassId: initialData?.courseClassId || "",
    status: initialData?.status || "PENDING",
    enrolledDate: initialData?.enrolledDate || new Date().toISOString().split('T')[0],
    unenrollmentDate: initialData?.unenrollmentDate || "",
    unenrollmentReason: initialData?.unenrollmentReason || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditMode
        ? `/api/course/enrollments/${initialData?.id}`
        : "/api/course/enrollments";
      const method = isEditMode ? "PUT" : "POST";

      const payload = {
        ...formData,
        unenrollmentDate: formData.unenrollmentDate || null,
        unenrollmentReason: formData.unenrollmentReason || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save enrollment");
      }

      router.push("/course/enrollments");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save enrollment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="rounded p-3 text-sm"
          style={{
            background: "hsl(0 40% 10%)",
            border: "1px dashed hsl(0 40% 22%)",
            color: "hsl(0 55% 60%)",
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Student *
          </label>
          <select
            className="h-9 w-full rounded border px-3 text-xs transition-all duration-150"
            style={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
            value={formData.studentId}
            onChange={(e) => handleChange("studentId", e.target.value)}
            required
            disabled={isEditMode}
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName || "Unnamed student"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Course Class *
          </label>
          <select
            className="h-9 w-full rounded border px-3 text-xs transition-all duration-150"
            style={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
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
          <label
            className="text-xs font-medium"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Status *
          </label>
          <select
            className="h-9 w-full rounded border px-3 text-xs transition-all duration-150"
            style={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            required
          >
            {enrollmentStatusValues.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-medium"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Enrolled Date *
          </label>
          <input
            className="h-9 w-full rounded border px-3 text-xs transition-all duration-150"
            style={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
            type="date"
            value={formData.enrolledDate}
            onChange={(e) => handleChange("enrolledDate", e.target.value)}
            required
          />
        </div>
      </div>

      {(formData.status === "WITHDREW" || formData.status === "CANCELLED") && (
        <div className="space-y-3 p-3 rounded" style={{ background: "hsl(var(--muted))" }}>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Unenrollment Date
            </label>
            <input
              className="h-9 w-full rounded border px-3 text-xs transition-all duration-150"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              type="date"
              value={formData.unenrollmentDate}
              onChange={(e) => handleChange("unenrollmentDate", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-medium"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Unenrollment Reason
            </label>
            <textarea
              className="h-16 w-full rounded border px-3 text-xs transition-all duration-150 resize-none"
              style={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              value={formData.unenrollmentReason}
              onChange={(e) => handleChange("unenrollmentReason", e.target.value)}
              placeholder="Reason for unenrollment..."
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150"
          style={{
            background: isLoading ? "hsl(200 70% 25%)" : "hsl(200 70% 32%)",
            color: "#fff",
          }}
          onMouseEnter={(e) => !isLoading && (e.currentTarget.style.background = "hsl(200 70% 38%)")}
          onMouseLeave={(e) => !isLoading && (e.currentTarget.style.background = "hsl(200 70% 32%)")}
        >
          <Save size={14} />
          {isLoading ? "Saving..." : isEditMode ? "Update Enrollment" : "Create Enrollment"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150"
          style={{
            background: "hsl(var(--muted))",
            color: "hsl(var(--foreground))",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--muted) / 0.8)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(var(--muted))")}
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </form>
  );
}
