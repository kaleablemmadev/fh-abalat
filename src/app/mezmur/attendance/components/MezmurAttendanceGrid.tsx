"use client";

import { useState } from "react";
import { Check, CheckCircle2, Loader2, X, Clock, Users, Save } from "lucide-react";

interface Member {
  id: string;
  fullName: string | null;
}

interface AttendanceType {
  id: string;
  name: string;
  value: number;
}

interface InitialAttendance {
  memberId: string;
  eventId: string;
  attendanceTypeId: string;
}

interface Event {
  id: string;
  title: string;
  date: Date;
  ethiopianYear: number;
  ethiopianMonth: number;
  ethiopianDay: number;
}

interface MezmurAttendanceGridProps {
  events: Event[];
  members: Member[];
  attendanceTypes: AttendanceType[];
  initialAttendance: InitialAttendance[];
  type: string;
  adminId: string;
}

function getPillStyle(name: string) {
  const n = name.toLowerCase();
  if (n.includes("attended") || n.includes("present") || n === "yes") {
    return {
      letter: "✓",
      icon: <Check size={11} strokeWidth={3} />,
      selected: { background: "hsl(25 70% 20%)", color: "hsl(25 70% 70%)", border: "1px solid hsl(25 70% 35%)" },
      unselected: { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" },
      hoverBorder: "hsl(25 70% 40%)",
    };
  }
  if (n.includes("permission") || n.includes("excused")) {
    return {
      letter: "P",
      icon: <Clock size={11} strokeWidth={2.5} />,
      selected: { background: "hsl(38 35% 16%)", color: "hsl(38 65% 65%)", border: "1px solid hsl(38 40% 28%)" },
      unselected: { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" },
      hoverBorder: "hsl(38 45% 35%)",
    };
  }
  if (n.includes("absent") || n === "no") {
    return {
      letter: "✗",
      icon: <X size={11} strokeWidth={3} />,
      selected: { background: "hsl(0 40% 16%)", color: "hsl(0 55% 65%)", border: "1px solid hsl(0 40% 28%)" },
      unselected: { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" },
      hoverBorder: "hsl(0 45% 35%)",
    };
  }
  return {
    letter: "?",
    icon: null,
    selected: { background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" },
    unselected: { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" },
    hoverBorder: "hsl(var(--primary))",
  };
}

export default function MezmurAttendanceGrid({
  events,
  members,
  attendanceTypes,
  initialAttendance,
  type,
  adminId,
}: MezmurAttendanceGridProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    initialAttendance.forEach((record) => {
      const key = `${record.memberId}_${record.eventId}`;
      initialState[key] = record.attendanceTypeId;
    });
    return initialState;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleAttendanceChange = (memberId: string, eventId: string, attendanceTypeId: string) => {
    const key = `${memberId}_${eventId}`;
    setAttendanceData((prev) => ({ ...prev, [key]: attendanceTypeId }));
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const payload = Object.entries(attendanceData).map(([key, attendanceTypeId]) => {
        const [memberId, eventId] = key.split("_");
        return { memberId, eventId, attendanceTypeId, markedById: adminId };
      });

      if (payload.length === 0) {
        setIsSaving(false);
        return;
      }

      const res = await fetch("/api/mezmur/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance: payload }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (members.length === 0) {
    return <div className="p-12 text-center opacity-50">No members found in this group.</div>;
  }

  if (events.length === 0) {
    return <div className="p-12 text-center opacity-50">No events found for this period.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden border border-[hsl(var(--border))]" style={{ background: "hsl(var(--card))" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr style={{ background: "hsl(var(--muted))", borderBottom: "1px solid hsl(var(--border))" }}>
                <th className="px-4 py-3 font-semibold uppercase tracking-wider sticky left-0 z-10 w-48" style={{ background: "hsl(var(--muted))" }}>Member</th>
                {events.map((event) => (
                  <th key={event.id} className="px-3 py-3 font-semibold uppercase tracking-wider text-center min-w-[100px]">
                    {event.ethiopianMonth}/{event.ethiopianDay}
                    <div className="text-[9px] font-normal opacity-50">{event.ethiopianYear}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent)/0.5)] transition-colors">
                  <td className="px-4 py-3 font-medium sticky left-0 z-10" style={{ background: "hsl(var(--card))" }}>{member.fullName || "Unnamed"}</td>
                  {events.map((event) => {
                    const currentId = attendanceData[`${member.id}_${event.id}`];
                    return (
                      <td key={event.id} className="px-2 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          {attendanceTypes.map((t) => {
                            const isSelected = currentId === t.id;
                            const style = getPillStyle(t.name);
                            return (
                              <button
                                key={t.id}
                                onClick={() => handleAttendanceChange(member.id, event.id, t.id)}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150"
                                style={isSelected ? style.selected : style.unselected}
                                title={t.name}
                              >
                                {isSelected ? style.icon : style.letter}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sticky bottom-4 rounded-lg p-4 flex items-center justify-between border border-[hsl(var(--border))]" style={{ background: "hsl(var(--card))", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center gap-4 text-xs">
          <Users size={14} className="opacity-50" />
          <span className="font-medium">{members.length} members</span>
          <span className="opacity-20">|</span>
          <span className="font-medium">{events.length} events</span>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === "success" && <div className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={14} /> Saved</div>}
          {saveStatus === "error" && <div className="text-xs text-red-400">Error saving</div>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-bold transition-all duration-150"
            style={{ background: "hsl(25 70% 40%)", color: "#fff" }}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
