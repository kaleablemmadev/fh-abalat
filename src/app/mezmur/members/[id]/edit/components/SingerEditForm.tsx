"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Loader2, User, Mic2 } from "lucide-react";

interface SingerEditFormProps {
  memberId: string;
  initialData: {
    fullName: string;
    phoneNumber: string;
    address: string;
    age: number;
    enrollment?: {
      id: string;
      groupType: string;
      status: string;
      enrolledDate: string;
    }
  };
}

const fieldBase = {
  className: "h-10 w-full rounded-lg border px-4 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)]",
  style: {
    background: "hsl(var(--background))",
    borderColor: "hsl(var(--border))",
    color: "hsl(var(--foreground))",
  },
};

export default function SingerEditForm({ memberId, initialData }: SingerEditFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: initialData.fullName,
    phoneNumber: initialData.phoneNumber,
    address: initialData.address,
    age: initialData.age,
    groupType: initialData.enrollment?.groupType || "BEGINNERS",
    status: initialData.enrollment?.status || "ACTIVE",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Update shared User profile
      const userRes = await fetch(`/api/abalat/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            age: Number(formData.age)
        }),
      });

      if (!userRes.ok) throw new Error("Failed to update profile");

      // 2. Update Mezmur Enrollment
      const enrollRes = await fetch("/api/mezmur/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: memberId,
          groupType: formData.groupType,
          status: formData.status,
          enrolledDate: initialData.enrollment?.enrolledDate || new Date().toLocaleDateString(),
        }),
      });

      if (!enrollRes.ok) throw new Error("Failed to update enrollment");

      router.push(`/mezmur/members/${memberId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating records");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto py-6 animate-fade-in">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Edit Singer</h2>
        <p className="text-sm opacity-50">Profile changes affect all system modes</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-[hsl(var(--border))] p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
            <User size={14} /> Shared Profile
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Full Name *</label>
            <input
                {...fieldBase}
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold">Phone Number</label>
                <input
                    {...fieldBase}
                    value={formData.phoneNumber}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-semibold">Age</label>
                <input
                    {...fieldBase}
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Address</label>
            <input
                {...fieldBase}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
            <Mic2 size={14} /> Mezmur Group
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold">Group Type</label>
                <select
                    {...fieldBase}
                    value={formData.groupType}
                    onChange={e => setFormData({...formData, groupType: e.target.value})}
                >
                    <option value="BEGINNERS">Beginners (ጀማሪ)</option>
                    <option value="CONTINUOUS">Continuous (ቀጣይ)</option>
                </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-semibold">Enrollment Status</label>
                <select
                    {...fieldBase}
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="WITHDREW">Withdrew</option>
                </select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">{error}</div>}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={() => router.back()} className="px-5 py-2 text-sm font-bold opacity-60">Cancel</button>
        <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-30"
        >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
