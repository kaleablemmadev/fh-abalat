"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Users, CheckCircle2, XCircle,
  Clock, Loader2, Save, Plus, Trash2,
  AlertTriangle, BookOpen, UserPlus
} from "lucide-react";
import { formatEthiopianDate } from "@/src/lib/ethiopiancal";

interface Instructor {
  id: string;
  fullName: string;
}

interface Course {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  date: Date;
  courseClass: {
    name: string;
    year: string;
  } | null;
}

interface AttendanceType {
  id: string;
  name: string;
  value: number;
}

interface AttendanceRecord {
  id?: string;
  instructorId: string;
  eventId: string;
  attendanceTypeId: string;
  durationHours: number;
  absenceReason?: string | null;
  substituteForId?: string | null;
  isBonus: boolean;
  courseId?: string | null;
}

interface InstructorAttendanceGlobalProps {
  events: Event[];
  instructors: Instructor[];
  courses: Course[];
  attendanceTypes: AttendanceType[];
}

export default function InstructorAttendanceGlobal({
  events,
  instructors,
  courses,
  attendanceTypes
}: InstructorAttendanceGlobalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeEvent = events.find(e => e.id === selectedEventId);

  useEffect(() => {
    if (selectedEventId) {
      loadAttendance(selectedEventId);
    }
  }, [selectedEventId]);

  const loadAttendance = async (eventId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/course/instructor-attendance?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubstitute = () => {
    if (!selectedEventId) return;
    setRecords(prev => [
      ...prev,
      {
        instructorId: "",
        eventId: selectedEventId,
        attendanceTypeId: attendanceTypes.find(t => t.value >= 1)?.id || "",
        durationHours: 1.0,
        isBonus: false,
        substituteForId: null
      }
    ]);
  };

  const handleUpdateRecord = (index: number, updates: Partial<AttendanceRecord>) => {
    setRecords(prev => {
      const newRecords = [...prev];
      newRecords[index] = { ...newRecords[index], ...updates };
      return newRecords;
    });
  };

  const handleRemoveRecord = (index: number) => {
    setRecords(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedEventId) return;

    // Validate records
    const invalid = records.some(r => !r.instructorId || !r.attendanceTypeId);
    if (invalid) {
      alert("Please ensure all records have an instructor and status selected.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/course/instructor-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance: records })
      });

      if (res.ok) {
        alert("Attendance saved successfully");
        loadAttendance(selectedEventId);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save attendance");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">የክፍል ሰለዳ (Select Session)</label>
            <select
              className="w-full h-11 px-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
            >
              <option value="">Select a class session to record attendance...</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>
                  {formatEthiopianDate(new Date(e.date), 'short')} - {e.title} ({e.courseClass?.name})
                </option>
              ))}
            </select>
          </div>
          {selectedEventId && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-11 px-8 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              መዝግብ (Save All)
            </button>
          )}
        </div>
      </div>

      {selectedEventId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Users size={16} />
              የመምህራን ዝርዝር (Attendance List)
            </h3>
            <button
              onClick={handleAddSubstitute}
              className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
            >
              <UserPlus size={14} />
              ተተኪ መምህር ጨምር (Add Substitute)
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid gap-4">
              {records.map((record, idx) => {
                const isAbsent = attendanceTypes.find(t => t.id === record.attendanceTypeId)?.value === 0;

                return (
                  <div
                    key={idx}
                    className={`p-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl transition-all ${
                      record.substituteForId ? "border-emerald-500/30 bg-emerald-500/5" : ""
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                      {/* Instructor and Role */}
                      <div className="md:col-span-3 space-y-3">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase opacity-30">Instructor</label>
                           <select
                            className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs font-bold outline-none"
                            value={record.instructorId}
                            onChange={e => handleUpdateRecord(idx, { instructorId: e.target.value })}
                           >
                             <option value="">Select Instructor...</option>
                             {instructors.map(inst => (
                               <option key={inst.id} value={inst.id}>{inst.fullName}</option>
                             ))}
                           </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`bonus-${idx}`}
                            checked={record.isBonus}
                            onChange={e => handleUpdateRecord(idx, { isBonus: e.target.checked })}
                            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`bonus-${idx}`} className="text-[10px] font-bold uppercase opacity-60">Bonus Session</label>
                        </div>
                      </div>

                      {/* Status and Credit */}
                      <div className="md:col-span-3 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase opacity-30">Status</label>
                          <div className="flex bg-[hsl(var(--background))] p-1 rounded-lg border border-[hsl(var(--border))]">
                            {attendanceTypes.map(type => (
                              <button
                                key={type.id}
                                onClick={() => handleUpdateRecord(idx, { attendanceTypeId: type.id })}
                                className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-black transition-all ${
                                  record.attendanceTypeId === type.id
                                    ? type.value >= 1
                                      ? "bg-emerald-500 text-white"
                                      : "bg-red-500 text-white"
                                    : "text-zinc-400 hover:bg-zinc-100"
                                }`}
                              >
                                {type.name.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase opacity-30">Hours Credit To Course</label>
                          <select
                            className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs font-bold outline-none"
                            value={record.courseId || ""}
                            onChange={e => handleUpdateRecord(idx, { courseId: e.target.value })}
                           >
                             <option value="">Assign to Course...</option>
                             {courses.map(c => (
                               <option key={c.id} value={c.id}>{c.name}</option>
                             ))}
                           </select>
                        </div>
                      </div>

                      {/* Details (Reason / Substitute) */}
                      <div className="md:col-span-4 space-y-3">
                        {isAbsent ? (
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-red-500">Reason for Absence (Mandatory)</label>
                            <input
                              type="text"
                              className="w-full h-10 px-3 bg-red-500/5 border border-red-500/20 rounded-lg text-xs font-medium placeholder:opacity-30"
                              placeholder="e.g., Sick, Out of town..."
                              value={record.absenceReason || ""}
                              onChange={e => handleUpdateRecord(idx, { absenceReason: e.target.value })}
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase opacity-30">Substitute For (Optional)</label>
                            <select
                              className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs font-bold outline-none"
                              value={record.substituteForId || ""}
                              onChange={e => handleUpdateRecord(idx, { substituteForId: e.target.value })}
                            >
                              <option value="">No substitution</option>
                              {instructors.filter(inst => inst.id !== record.instructorId).map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.fullName}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                           <div className="space-y-1 flex-1">
                              <label className="text-[9px] font-black uppercase opacity-30">Duration (Hours)</label>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs font-bold"
                                value={record.durationHours}
                                onChange={e => handleUpdateRecord(idx, { durationHours: parseFloat(e.target.value) || 0 })}
                              />
                           </div>
                           <div className="space-y-1 flex-1">
                              <label className="text-[9px] font-black uppercase opacity-30 opacity-0">Action</label>
                              <div className="h-10 flex items-center text-[10px] text-zinc-400 italic">
                                {record.id ? "Already saved" : "New entry"}
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="md:col-span-2 flex justify-end pt-5">
                         {!record.id && (
                           <button
                             onClick={() => handleRemoveRecord(idx)}
                             className="p-3 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-all"
                           >
                             <Trash2 size={18} />
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {records.length === 0 && !isLoading && (
                <div className="p-12 text-center border-2 border-dashed rounded-3xl opacity-30 italic text-sm">
                  No attendance records for this session yet. Start by adding instructors or substitutes.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-20 text-center bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl opacity-40">
           <Calendar className="mx-auto mb-4 opacity-20" size={48} />
           <p className="font-bold">Select a session above to manage instructor attendance</p>
        </div>
      )}
    </div>
  );
}
