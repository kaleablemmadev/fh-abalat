"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Plus, X as XIcon, Loader2, BookOpen, Layers, Calculator, FileUp, Info } from "lucide-react";
import { courseClassTypeValues, courseClassTypeDisplayNames } from "../../constants/courseEnum";
import { supabase } from "@/src/lib/supabase";

interface CourseFormProps {
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    topics?: string[];
    credits?: number;
    instructorId?: string;
    departmentId?: string;
    isGiven?: boolean;
    classTypes?: string[];
    semesterPreference?: "FIRST" | "SECOND" | "BOTH";
    teacherHandoutUrl?: string;
    studentHandoutUrl?: string;
    attendanceWeight?: number;
    midExamWeight?: number;
    assignmentWeight?: number;
    finalExamWeight?: number;
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
    isGiven: initialData?.isGiven ?? true,
    classTypes: initialData?.classTypes || ["KEDAMAY"],
    semesterPreference: initialData?.semesterPreference || "FIRST",
    teacherHandoutUrl: initialData?.teacherHandoutUrl || "",
    studentHandoutUrl: initialData?.studentHandoutUrl || "",
    attendanceWeight: initialData?.attendanceWeight || 10,
    midExamWeight: initialData?.midExamWeight || 25,
    assignmentWeight: initialData?.assignmentWeight || 15,
    finalExamWeight: initialData?.finalExamWeight || 50,
  });
  const [teacherFile, setTeacherFile] = useState<File | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let teacherUrl = formData.teacherHandoutUrl;
      let studentUrl = formData.studentHandoutUrl;

      if (teacherFile || studentFile) {
        setUploadingFiles(true);
        if (teacherFile) {
          const fileExt = teacherFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `teacher/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('course-handouts')
            .upload(filePath, teacherFile);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('course-handouts').getPublicUrl(filePath);
          teacherUrl = data.publicUrl;
        }
        if (studentFile) {
          const fileExt = studentFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `student/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('course-handouts')
            .upload(filePath, studentFile);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('course-handouts').getPublicUrl(filePath);
          studentUrl = data.publicUrl;
        }
      }

      const url = isEditMode
        ? `/api/course/courses/${initialData?.id}`
        : "/api/course/courses";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          teacherHandoutUrl: teacherUrl,
          studentHandoutUrl: studentUrl,
          credits: formData.credits ? parseInt(formData.credits.toString()) : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        let message = "Failed to save course";
        if (typeof errorData.error === 'string') {
          message = errorData.error;
        } else if (errorData.error?.fieldErrors) {
          // Handle Zod flattened errors
          const firstField = Object.keys(errorData.error.fieldErrors)[0];
          const firstError = errorData.error.fieldErrors[firstField][0];
          message = `${firstField}: ${firstError}`;
        }
        throw new Error(message);
      }

      router.push("/course/courses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
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

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>
              Permanent Class Assignment *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-[hsl(var(--muted)/0.3)]" style={{ borderColor: "hsl(var(--border))" }}>
              {courseClassTypeValues.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[hsl(217,70%,32%)] focus:ring-[hsl(217,70%,32%)]"
                    checked={formData.classTypes.includes(type)}
                    onChange={(e) => {
                      const newTypes = e.target.checked
                        ? [...formData.classTypes, type]
                        : formData.classTypes.filter(t => t !== type);
                      setFormData(prev => ({ ...prev, classTypes: newTypes }));
                    }}
                  />
                  <span className="text-xs font-medium group-hover:text-[hsl(var(--primary))] transition-colors">
                    {courseClassTypeDisplayNames[type as keyof typeof courseClassTypeDisplayNames]}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-[10px] opacity-50 italic mt-1">Select one or more classes where this course will be taught every year.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Offered In *
            </label>
            <select
              {...fieldBase}
              value={formData.semesterPreference}
              onChange={(e) => handleChange("semesterPreference", e.target.value)}
              required
            >
              <option value="FIRST">1st Semester Only</option>
              <option value="SECOND">2nd Semester Only</option>
              <option value="BOTH">Both Semesters</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-2">
            <FileUp size={14} className="opacity-50" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Course Handouts</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Teacher Handout (PDF/Doc)
              </label>
              <input
                type="file"
                className="block w-full text-[10px] text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[hsl(var(--primary)/0.1)] file:text-[hsl(var(--primary))] hover:file:bg-[hsl(var(--primary)/0.2)]"
                onChange={(e) => setTeacherFile(e.target.files?.[0] || null)}
              />
              {formData.teacherHandoutUrl && (
                <p className="text-[9px] text-emerald-500">Current file exists</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                Student Handout (PDF/Doc)
              </label>
              <input
                type="file"
                className="block w-full text-[10px] text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[hsl(var(--primary)/0.1)] file:text-[hsl(var(--primary))] hover:file:bg-[hsl(var(--primary)/0.2)]"
                onChange={(e) => setStudentFile(e.target.files?.[0] || null)}
              />
              {formData.studentHandoutUrl && (
                <p className="text-[9px] text-emerald-500">Current file exists</p>
              )}
            </div>
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
                Math.abs((formData.attendanceWeight + formData.midExamWeight + formData.assignmentWeight + formData.finalExamWeight) - 100) < 0.01 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              Total: {formData.attendanceWeight + formData.midExamWeight + formData.assignmentWeight + formData.finalExamWeight}%
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

        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <input
            type="checkbox"
            id="isGiven"
            checked={formData.isGiven}
            onChange={(e) => setFormData(prev => ({ ...prev, isGiven: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-[hsl(217,70%,32%)] focus:ring-[hsl(217,70%,32%)]"
          />
          <label htmlFor="isGiven" className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Currently Active (Given this term)
          </label>
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
