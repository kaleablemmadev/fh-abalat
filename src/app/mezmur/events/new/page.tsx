"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { ethMonthNames, getEthiopianToday, ethiopianToGregorianDate } from "@/src/lib/ethiopiancal";

async function getAdminId() {
  // Since this is client side, we'll get it from a session eventually.
  // For now, mirroring the Abalat implementation's placeholder approach if needed.
  return "system-admin";
}

export default function NewMezmurEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const today = getEthiopianToday();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    eventType: "MEZMUR_BEGINNERS",
    ethiopianYear: String(today.year),
    ethiopianMonth: "1",
    ethiopianDay: "1",
    hour: "10",
    minute: "00",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const monthNumber = parseInt(formData.ethiopianMonth);
      const day = parseInt(formData.ethiopianDay);
      const year = parseInt(formData.ethiopianYear);
      const hour = parseInt(formData.hour) || 0;
      const minute = parseInt(formData.minute) || 0;

      const gregDateObj = ethiopianToGregorianDate({ year, month: monthNumber, day });
      const gregDate = new Date(gregDateObj.year, gregDateObj.month - 1, gregDateObj.day, hour, minute);

      const payload = {
        title: formData.title.trim(),
        description: formData.description,
        location: formData.location,
        eventType: formData.eventType,
        date: gregDate.toISOString(),
        createdById: "system-admin", // Placeholder
      };

      const res = await fetch("/api/mezmur/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create event");

      router.push("/mezmur/schedule");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto py-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] opacity-60">
            <ArrowLeft size={18} />
        </button>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">New Mezmur Event</h1>
            <p className="text-sm opacity-50">Schedule a manual session for Beginners or Continuous groups</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-[hsl(var(--border))] p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Event Title</label>
            <input
              className="w-full h-10 rounded-lg border px-4 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)]"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Tuesday Practice"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Group Type</label>
            <select
              className="w-full h-10 rounded-lg border px-4 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)] appearance-none"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
            >
              <option value="MEZMUR_BEGINNERS">Beginners (ጀማሪ)</option>
              <option value="MEZMUR_CONTINUOUS">Continuous (ቀጣይ)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Date (Ethiopian)</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                className="h-10 rounded-lg border px-3 text-sm"
                style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                value={formData.ethiopianMonth}
                onChange={(e) => setFormData({ ...formData, ethiopianMonth: e.target.value })}
              >
                {Object.entries(ethMonthNames).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
              </select>
              <input
                type="number"
                className="h-10 rounded-lg border px-3 text-sm"
                style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                value={formData.ethiopianDay}
                onChange={(e) => setFormData({ ...formData, ethiopianDay: e.target.value })}
                min={1} max={30}
              />
              <input
                type="number"
                className="h-10 rounded-lg border px-3 text-sm"
                style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                value={formData.ethiopianYear}
                onChange={(e) => setFormData({ ...formData, ethiopianYear: e.target.value })}
              />
            </div>
          </div>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20">{error}</div>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
          <button type="button" onClick={() => router.back()} className="px-5 py-2 text-sm font-bold opacity-60">Cancel</button>
          <button
            type="submit"
            disabled={isLoading || !formData.title}
            className="px-8 py-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-sm font-bold transition-all disabled:opacity-30 flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
            {isLoading ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
