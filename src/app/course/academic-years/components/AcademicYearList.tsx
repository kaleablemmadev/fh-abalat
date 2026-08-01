"use client";

import { useState } from "react";
import { Plus, Calendar, CheckCircle2, XCircle, Loader2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface AcademicYear {
  id: string;
  year: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  s1Start: string | Date | null;
  s1End: string | Date | null;
  s2Start: string | Date | null;
  s2End: string | Date | null;
  s1MidExamDate: string | Date | null;
  s1FinalExamDate: string | Date | null;
  s2MidExamDate: string | Date | null;
  s2FinalExamDate: string | Date | null;
  midExamMinAttendance: number;
  finalExamMinAttendance: number;
  classes: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
}

interface AcademicYearListProps {
  initialYears: any[];
}

export default function AcademicYearList({ initialYears }: AcademicYearListProps) {
  const router = useRouter();
  const [years, setYears] = useState<AcademicYear[]>(initialYears);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newYear, setNewYear] = useState({
    year: "",
    startDate: "",
    endDate: "",
    isActive: false,
    s1Start: "",
    s1End: "",
    s2Start: "",
    s2End: "",
    s1MidExamDate: "",
    s1FinalExamDate: "",
    s2MidExamDate: "",
    s2FinalExamDate: "",
    midExamMinAttendance: 5,
    finalExamMinAttendance: 5,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/course/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newYear),
      });
      if (res.ok) {
        const created = await res.json();
        setYears([created, ...years]);
        setIsAdding(false);
        setNewYear({
          year: "",
          startDate: "",
          endDate: "",
          isActive: false,
          s1Start: "",
          s1End: "",
          s2Start: "",
          s2End: "",
          s1MidExamDate: "",
          s1FinalExamDate: "",
          s2MidExamDate: "",
          s2FinalExamDate: "",
          midExamMinAttendance: 5,
          finalExamMinAttendance: 5,
        });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClass = async (yearId: string, classId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/course/course-classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setYears(years.map(y => {
          if (y.id === yearId) {
            return {
              ...y,
              classes: y.classes.map(c => c.id === classId ? { ...c, isActive: !currentStatus } : c)
            };
          }
          return y;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(217,70%,32%)] text-white rounded-lg font-semibold text-sm transition-all active:scale-95"
          >
            <Plus size={16} />
            Add New Year
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm space-y-6 animate-slide-in">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">General Term Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase opacity-50">Year Name</label>
                <input
                  type="text"
                  placeholder="e.g., 2027 E.C."
                  className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                  value={newYear.year}
                  onChange={e => setNewYear({ ...newYear, year: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase opacity-50">Overall Start</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                  value={newYear.startDate}
                  onChange={e => setNewYear({ ...newYear, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase opacity-50">Overall End</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                  value={newYear.endDate}
                  onChange={e => setNewYear({ ...newYear, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[hsl(var(--border))] pt-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500">1st Semester Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">S1 Start</label>
                  <input type="date" className="w-full h-9 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs" value={newYear.s1Start} onChange={e => setNewYear({...newYear, s1Start: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">S1 End</label>
                  <input type="date" className="w-full h-9 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs" value={newYear.s1End} onChange={e => setNewYear({...newYear, s1End: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">S1 Mid Exam</label>
                  <input type="date" className="w-full h-9 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs" value={newYear.s1MidExamDate} onChange={e => setNewYear({...newYear, s1MidExamDate: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">S1 Final Exam</label>
                  <input type="date" className="w-full h-9 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs" value={newYear.s1FinalExamDate} onChange={e => setNewYear({...newYear, s1FinalExamDate: e.target.value})} required />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500">2nd Semester Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">S2 Start</label>
                  <input type="date" className="w-full h-9 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs" value={newYear.s2Start} onChange={e => setNewYear({...newYear, s2Start: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">S2 End</label>
                  <input type="date" className="w-full h-9 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs" value={newYear.s2End} onChange={e => setNewYear({...newYear, s2End: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">S2 Mid Exam</label>
                  <input type="date" className="w-full h-9 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs" value={newYear.s2MidExamDate} onChange={e => setNewYear({...newYear, s2MidExamDate: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase opacity-50">S2 Final Exam</label>
                  <input type="date" className="w-full h-9 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs" value={newYear.s2FinalExamDate} onChange={e => setNewYear({...newYear, s2FinalExamDate: e.target.value})} required />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-[hsl(var(--border))] pt-6">
             <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">Eligibility Rules (Min Attendance)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase opacity-50">Mid-Exam Threshold</label>
                  <input type="number" min="0" className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm" value={newYear.midExamMinAttendance} onChange={e => setNewYear({...newYear, midExamMinAttendance: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase opacity-50">Final-Exam Threshold</label>
                  <input type="number" min="0" className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm" value={newYear.finalExamMinAttendance} onChange={e => setNewYear({...newYear, finalExamMinAttendance: parseInt(e.target.value) || 0})} />
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={newYear.isActive}
              onChange={e => setNewYear({ ...newYear, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[hsl(217,70%,32%)]"
            />
            <label htmlFor="isActive" className="text-sm font-medium">Set as current active year</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-[hsl(217,70%,32%)] text-white rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Initialize Year & Classes
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {years.map((year) => (
          <div
            key={year.id}
            className={`p-6 bg-[hsl(var(--card))] border rounded-xl transition-all ${
              year.isActive ? "border-[hsl(217,70%,32%)] shadow-md" : "border-[hsl(var(--border))]"
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${year.isActive ? "bg-[hsl(217,70%,32%)/0.1] text-[hsl(217,70%,32%)]" : "bg-zinc-100 text-zinc-400"}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {year.year}
                    {year.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded uppercase font-bold tracking-wider">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase opacity-30">S1 Mid Threshold</p>
                  <p className="text-sm font-bold">{year.midExamMinAttendance}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase opacity-30">S1 Final Threshold</p>
                  <p className="text-sm font-bold">{year.finalExamMinAttendance}</p>
                </div>
              </div>
            </div>

            {year.s1MidExamDate && (
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold uppercase opacity-50">S1 Mid Exam</p>
                  <p className="text-[10px] font-bold">{year.s1MidExamDate ? new Date(year.s1MidExamDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold uppercase opacity-50">S1 Final Exam</p>
                  <p className="text-[10px] font-bold">{year.s1FinalExamDate ? new Date(year.s1FinalExamDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold uppercase opacity-50">S2 Mid Exam</p>
                  <p className="text-[10px] font-bold">{year.s2MidExamDate ? new Date(year.s2MidExamDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold uppercase opacity-50">S2 Final Exam</p>
                  <p className="text-[10px] font-bold">{year.s2FinalExamDate ? new Date(year.s2FinalExamDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] block">
                Class Availability
              </label>
              <div className="flex flex-wrap gap-2">
                {year.classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => toggleClass(year.id, cls.id, cls.isActive)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                      cls.isActive
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                        : "bg-zinc-100 border-zinc-200 text-zinc-400 grayscale"
                    }`}
                  >
                    {cls.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {cls.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] italic mt-2">
                Turn off classes that aren't running this year. Courses assigned to these classes will be hidden.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
