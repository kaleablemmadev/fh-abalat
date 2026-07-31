"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Plus, Trash2, Loader2, Users, Music } from "lucide-react";
import { formatEthiopianDate, dateToEthiopian } from "@/src/lib/ethiopiancal";

interface MezmurEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  eventType: "MEZMUR_REGULAR" | "MEZMUR_BEGINNERS" | "MEZMUR_CONTINUOUS";
  _count: { attendances: number };
}

interface MezmurEventListProps {
  initialEvents: MezmurEvent[];
}

const typeLabels: Record<string, string> = {
  MEZMUR_REGULAR: "Regular",
  MEZMUR_BEGINNERS: "Beginners",
  MEZMUR_CONTINUOUS: "Continuous",
};

const typeColors: Record<string, string> = {
  MEZMUR_REGULAR: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  MEZMUR_BEGINNERS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  MEZMUR_CONTINUOUS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function MezmurEventList({ initialEvents }: MezmurEventListProps) {
  const [events, setEvents] = useState(initialEvents);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event? All attendance records will be lost.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/mezmur/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      alert("Error deleting event");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[hsl(var(--border))]" style={{ background: "hsl(var(--card))" }}>
        {events.length === 0 ? (
          <div className="p-20 text-center opacity-30 flex flex-col items-center">
            <Calendar size={48} className="mb-4" />
            <p className="text-sm font-medium">No Mezmur events scheduled.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {events.map((e) => {
              const ethDate = dateToEthiopian(new Date(e.date));
              return (
                <div key={e.id} className="p-4 flex items-center justify-between group hover:bg-[hsl(var(--accent)/0.5)] transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${typeColors[e.eventType]}`}>
                        {typeLabels[e.eventType]}
                      </span>
                      <h4 className="font-bold text-sm truncate" style={{ color: "hsl(var(--foreground))" }}>{e.title}</h4>
                    </div>
                    <p className="text-[10px] opacity-50 flex items-center gap-2">
                        <span>{ethDate.month} {ethDate.day}፣ {ethDate.year} ዓ.ም.</span>
                        <span className="opacity-30">|</span>
                        <span className="flex items-center gap-1"><Users size={10} /> {e._count.attendances} attending</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/mezmur/attendance/${e.eventType.replace("MEZMUR_", "").toLowerCase()}?month=${ethDate.year % 100}&year=${ethDate.year}`}
                      className="p-2 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deletingId === e.id}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      {deletingId === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
