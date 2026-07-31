"use client";

import { useState } from "react";
import { Check, CheckCircle2, Loader2, X, Clock, Users, Save, Search } from "lucide-react";

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
  attendanceTypeId: string;
}

interface MezmurSingleEventGridProps {
  eventId: string;
  members: Member[];
  attendanceTypes: AttendanceType[];
  initialAttendance: InitialAttendance[];
  adminId: string;
}

function getPillStyle(name: string) {
  const n = name.toLowerCase();
  if (n.includes("attended") || n.includes("present") || n === "yes") {
    return {
      letter: "✓",
      icon: <Check size={14} strokeWidth={3} />,
      selected: { background: "hsl(25 70% 40%)", color: "#fff", border: "1px solid transparent" },
      unselected: { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" },
    };
  }
  if (n.includes("permission") || n.includes("excused")) {
    return {
      letter: "P",
      icon: <Clock size={14} strokeWidth={2.5} />,
      selected: { background: "hsl(38 70% 40%)", color: "#fff", border: "1px solid transparent" },
      unselected: { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" },
    };
  }
  if (n.includes("absent") || n === "no") {
    return {
      letter: "✗",
      icon: <X size={14} strokeWidth={3} />,
      selected: { background: "hsl(0 70% 40%)", color: "#fff", border: "1px solid transparent" },
      unselected: { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" },
    };
  }
  return {
    letter: "?",
    icon: null,
    selected: { background: "hsl(var(--primary))", color: "#fff", border: "1px solid transparent" },
    unselected: { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" },
  };
}

export default function MezmurSingleEventGrid({
  eventId,
  members,
  attendanceTypes,
  initialAttendance,
  adminId,
}: MezmurSingleEventGridProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    initialAttendance.forEach((record) => {
      initialState[record.memberId] = record.attendanceTypeId;
    });
    return initialState;
  });

  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const filteredMembers = members.filter(m =>
    m.fullName?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAttendanceChange = (memberId: string, attendanceTypeId: string) => {
    setAttendanceData((prev) => ({ ...prev, [memberId]: attendanceTypeId }));
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const payload = Object.entries(attendanceData).map(([memberId, attendanceTypeId]) => ({
        memberId,
        eventId,
        attendanceTypeId,
        markedById: adminId,
      }));

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

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
        <input
          className="w-full h-10 rounded-lg border pl-10 pr-4 text-sm transition-all"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
          placeholder="Search singers by name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        <div className="divide-y divide-[hsl(var(--border))]">
          {filteredMembers.map((member) => {
            const currentId = attendanceData[member.id];
            return (
              <div key={member.id} className="p-4 flex items-center justify-between group hover:bg-[hsl(var(--accent)/0.5)] transition-colors">
                <p className="font-bold text-sm">{member.fullName || "Unnamed Singer"}</p>

                <div className="flex gap-1.5">
                  {attendanceTypes.map((t) => {
                    const isSelected = currentId === t.id;
                    const style = getPillStyle(t.name);
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleAttendanceChange(member.id, t.id)}
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 border"
                        style={isSelected ? style.selected : style.unselected}
                        title={t.name}
                      >
                        {isSelected ? style.icon : <span className="font-bold opacity-30">{style.letter}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filteredMembers.length === 0 && (
            <div className="p-12 text-center opacity-30 text-sm italic">No singers match your search.</div>
          )}
        </div>
      </div>

      <div className="sticky bottom-4 rounded-xl p-4 flex items-center justify-between border border-[hsl(var(--border))]" style={{ background: "hsl(var(--card))", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-50">
          <Users size={14} /> {members.length} total singers
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === "success" && <div className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={14} /> All records saved</div>}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 px-6 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-sm font-black flex items-center gap-2 transition-all disabled:opacity-30"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving..." : "Commit Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}
