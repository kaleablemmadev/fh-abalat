"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Plus, X as XIcon, Loader2, BookOpen } from "lucide-react";

interface CourseFormProps {
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    topics?: string[];
    credits?: number;
    instructorId?: string;
    departmentId?: string;
  };
  isEditMode?: boolean;
  instructors: Array<{
    id: string;
    fullName: string;
  }>;
  departments: Array<{
    id: string;
    name: string;
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

export default function CourseForm({ initialData, isEditMode = false, instructors, departments }: CourseFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    topics: initialData?.topics || [],
    credits: initialData?.credits || "",
    instructorId: initialData?.instructorId || "",
    departmentId: initialData?.departmentId || "",
  });
  const [newTopic, setNewTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditMode
        ? `/api/course/courses/${initialData?.id}`
        : "/api/course/courses";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          credits: formData.credits ? parseInt(formData.credits.toString()) : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save course");
      }

      router.push("/course/courses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      setFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, newTopic.trim()],
      }));
      setNewTopic("");
    }
  };

  const removeTopic = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in max-w-lg">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          {isEditMode ? "Edit Course" : "New Course"}
        </h2>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {isEditMode ? "Update the details for this course." : "Create a new course entry."}
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
            <BookOpen size={14} className="opacity-50" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Course Information</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Course Name *
          </label>
          <input
            {...fieldBase}
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., Introduction to Theology"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Description
          </label>
          <textarea
            {...fieldBase}
            className="h-20 w-full rounded border px-3 py-2 text-xs transition-all duration-150 resize-none"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Course description..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Topics
          </label>
          <div className="flex gap-2">
            <input
              {...fieldBase}
              className="h-9 flex-1 rounded border px-3 text-xs transition-all duration-150"
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Add a topic..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
            />
            <button
              type="button"
              onClick={addTopic}
              className="inline-flex items-center justify-center rounded px-3 py-2 transition-colors duration-150 border h-9"
              style={{
                background: "hsl(var(--muted))",
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          {formData.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.topics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
                  style={{
                    background: "hsl(var(--muted))",
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => removeTopic(index)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <XIcon size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Credits
            </label>
            <input
              {...fieldBase}
              type="number"
              value={formData.credits}
              onChange={(e) => handleChange("credits", e.target.value)}
              placeholder="e.g., 3"
              min="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Instructor *
            </label>
            <select
              {...fieldBase}
              value={formData.instructorId}
              onChange={(e) => handleChange("instructorId", e.target.value)}
              required
            >
              <option value="">Select instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Department *
            </label>
            <select
              {...fieldBase}
              value={formData.departmentId}
              onChange={(e) => handleChange("departmentId", e.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
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
          {isLoading ? "Saving…" : isEditMode ? "Save Changes" : "Create Course"}
        </button>
      </div>
    </form>
  );
}
