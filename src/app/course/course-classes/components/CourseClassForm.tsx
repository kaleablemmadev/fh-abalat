"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Loader2, Layers } from "lucide-react";
import { courseClassTypeValues } from "../../constants/courseEnum";

interface CourseClassFormProps {
  initialData?: {
    id?: string;
    name?: string;
    year?: string;
    startDate?: string;
    endDate?: string;
  };
  isEditMode?: boolean;
}

const fieldBase = {
  className: "h-9 w-full rounded border px-3 text-sm transition-all duration-150 appearance-none",
  style: {
    background: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
  },
};

export default function CourseClassForm({ initialData, isEditMode = false }: CourseClassFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || "KEDAMAY",
    year: initialData?.year || new Date().getFullYear().toString(),
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditMode
        ? `/api/course/course-classes/${initialData?.id}`
        : "/api/course/course-classes";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save course class");
      }

      router.push("/course/course-classes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course class");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in max-w-sm">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          {isEditMode ? "Edit Class" : "New Class"}
        </h2>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {isEditMode ? "Update the details for this class instance." : "Create a new course class for a year."}
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
            <Layers size={14} className="opacity-50" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Class Details</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Class Type *
            </label>
            <select
              {...fieldBase}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            >
              {courseClassTypeValues.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Year *
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
        </div>

        <div className="space-y-4 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Term Dates (Optional)</p>

            <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Start Date
                </label>
                <input
                {...fieldBase}
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                End Date
                </label>
                <input
                {...fieldBase}
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                />
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
          {isLoading ? "Saving…" : isEditMode ? "Save Changes" : "Create Class"}
        </button>
      </div>
    </form>
  );
}
