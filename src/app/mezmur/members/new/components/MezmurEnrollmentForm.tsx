"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Loader2, Music, UserPlus } from "lucide-react";
import { getEthiopianToday, formatEthiopianDate } from "@/src/lib/ethiopiancal";

interface Student {
  id: string;
  fullName: string | null;
}

interface MezmurEnrollmentFormProps {
  students: Student[];
}

const fieldBase = {
  className: "h-9 w-full rounded border px-3 text-sm transition-all duration-150 appearance-none",
  style: {
    background: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--foreground))",
  },
};

export default function MezmurEnrollmentForm({ students }: MezmurEnrollmentFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentId: "",
    groupType: "BEGINNERS",
    enrolledDate: formatEthiopianDate(getEthiopianToday(), 'short'),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mezmur/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to enroll singer");
      }

      router.push("/mezmur/members");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll singer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Enroll Singer</h2>
        <p className="text-sm opacity-50">Assign an existing member to a Mezmur group</p>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] p-4 space-y-4" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center gap-2 mb-2">
            <UserPlus size={14} className="opacity-50" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Enrollment Info</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">Select Member *</label>
          <select
            {...fieldBase}
            value={formData.studentId}
            onChange={(e) => handleChange("studentId", e.target.value)}
            required
          >
            <option value="">Choose a member...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName || "Unnamed Member"}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">Mezmur Group *</label>
          <select
            {...fieldBase}
            value={formData.groupType}
            onChange={(e) => handleChange("groupType", e.target.value)}
            required
          >
            <option value="BEGINNERS">Beginners (ጀማሪ)</option>
            <option value="CONTINUOUS">Continuous (ቀጣይ)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">Enrollment Date (Ethiopian) *</label>
          <input
            {...fieldBase}
            type="text"
            value={formData.enrolledDate}
            onChange={(e) => handleChange("enrolledDate", e.target.value)}
            placeholder="Month DD, YYYY"
            required
          />
        </div>
      </div>

      {error && (
        <div className="rounded p-3 text-sm text-red-500 border border-red-500/20 bg-red-500/10">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-1.5 rounded-lg text-sm font-bold border opacity-60 hover:opacity-100 transition-all"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading || !formData.studentId}
          className="px-6 py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-30 flex items-center gap-2"
          style={{ background: "hsl(25 70% 45%)", color: "#fff" }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isLoading ? "Enrolling..." : "Enroll Singer"}
        </button>
      </div>
    </form>
  );
}
