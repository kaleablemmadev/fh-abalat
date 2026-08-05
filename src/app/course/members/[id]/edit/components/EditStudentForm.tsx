"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";

const fieldBase = {
  className: "h-10 w-full rounded-lg border px-4 text-sm transition-all outline-none focus:border-blue-500",
  style: {
    background: "hsl(var(--background))",
    borderColor: "hsl(var(--border))",
    color: "hsl(var(--foreground))",
  },
};

interface EditStudentFormProps {
  student: any;
}

export default function EditStudentForm({ student }: EditStudentFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: student.fullName || "",
    phoneNumber: student.phoneNumber || "",
    address: student.address || "",
    age: student.age?.toString() || "",
    gender: student.gender || "MALE",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/course/members/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update student");
      }

      router.push(`/course/members/${student.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating student");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto py-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] opacity-60">
            <ArrowLeft size={18} />
        </button>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Student Record</h1>
            <p className="text-sm opacity-50 font-mono">{student.privateId}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Full Name *</label>
          <input
            {...fieldBase}
            value={formData.fullName}
            onChange={e => handleChange("fullName", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Gender</label>
            <select
              {...fieldBase}
              value={formData.gender}
              onChange={e => handleChange("gender", e.target.value)}
            >
              <option value="MALE">Male (ወንድ)</option>
              <option value="FEMALE">Female (ሴት)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Age *</label>
            <input
              {...fieldBase}
              type="number"
              value={formData.age}
              onChange={e => handleChange("age", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Phone Number</label>
          <input
            {...fieldBase}
            value={formData.phoneNumber}
            onChange={e => handleChange("phoneNumber", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Address</label>
          <input
            {...fieldBase}
            value={formData.address}
            onChange={e => handleChange("address", e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm font-bold opacity-60 hover:opacity-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-30 flex items-center gap-2"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </form>
  );
}
