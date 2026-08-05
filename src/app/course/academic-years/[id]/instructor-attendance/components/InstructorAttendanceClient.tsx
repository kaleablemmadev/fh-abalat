"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { formatEthiopianDate } from "@/src/lib/ethiopiancal";

interface Instructor {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
}

interface Event {
  id: string;
  title: string;
  date: Date;
  ethiopianYear?: number | null;
  ethiopianMonth?: number | null;
  ethiopianDay?: number | null;
  courseClass: {
    name: string;
    year: string;
  } | null;
}

interface InstructorAttendanceClientProps {
  academicYear: any;
  instructors: Instructor[];
  events: Event[];
}

interface AttendanceRecord {
  instructorId: string;
  eventId: string;
  attendanceTypeId?: string;
}

export default function InstructorAttendanceClient({
  academicYear,
  instructors,
  events,
}: InstructorAttendanceClientProps) {
  const [attendanceTypes, setAttendanceTypes] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAttendanceTypes();
  }, []);

  const loadAttendanceTypes = async () => {
    try {
      const res = await fetch("/api/attendance-types?mode=COURSE");
      if (res.ok) {
        const data = await res.json();
        setAttendanceTypes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendanceForEvent = async (eventId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/course/instructor-attendance?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        const records = data.map((record: any) => ({
          instructorId: record.instructorId,
          eventId: record.eventId,
          attendanceTypeId: record.attendanceTypeId,
        }));
        setAttendanceRecords(records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    loadAttendanceForEvent(eventId);
  };

  const handleAttendanceChange = (instructorId: string, attendanceTypeId: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.instructorId === instructorId
          ? { ...record, attendanceTypeId }
          : record
      )
    );
  };

  const handleSave = async () => {
    if (!selectedEventId) return;

    setIsSaving(true);
    try {
      const payload = attendanceRecords.map((record) => ({
        instructorId: record.instructorId,
        eventId: selectedEventId,
        attendanceTypeId: record.attendanceTypeId,
      }));

      const res = await fetch("/api/course/instructor-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Instructor attendance saved successfully");
      } else {
        alert("Failed to save instructor attendance");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save instructor attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const getAttendanceRecord = (instructorId: string) => {
    return attendanceRecords.find((r) => r.instructorId === instructorId);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Instructor Attendance - {academicYear.year}
        </h1>
        <p className="text-sm mt-0.5 text-[hsl(var(--muted-foreground))]">
          Track instructor attendance for courses in this academic year
        </p>
      </div>

      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-[hsl(var(--muted-foreground))]" size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Select Event
            </h3>
          </div>

          <select
            className="w-full h-12 px-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(217,70%,32%)/0.2]"
            value={selectedEventId || ""}
            onChange={(e) => handleEventChange(e.target.value)}
          >
            <option value="">Select an event to mark attendance</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} - {formatEthiopianDate(new Date(event.date))} ({event.courseClass?.name} {event.courseClass?.year})
              </option>
            ))}
          </select>
        </div>

        {selectedEventId && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[hsl(var(--muted-foreground))]" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="text-[hsl(var(--muted-foreground))]" size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                      Instructors ({instructors.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {instructors.map((instructor) => {
                      const record = getAttendanceRecord(instructor.id);
                      return (
                        <div
                          key={instructor.id}
                          className="flex items-center justify-between p-4 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[hsl(217,70%,32%)/0.1] flex items-center justify-center text-[hsl(217,70%,32%)] font-bold">
                              {instructor.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{instructor.fullName}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {instructor.email || instructor.phoneNumber || "No contact info"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {attendanceTypes.map((type) => (
                              <button
                                key={type.id}
                                onClick={() => handleAttendanceChange(instructor.id, type.id)}
                                className={`p-2 rounded-lg transition-all ${
                                  record?.attendanceTypeId === type.id
                                    ? type.value >= 1
                                      ? "bg-emerald-500 text-white"
                                      : "bg-red-500 text-white"
                                    : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                                }`}
                                title={type.name}
                              >
                                {type.value >= 1 ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[hsl(var(--border))]">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[hsl(217,70%,32%)] text-white rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                    Save Attendance
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
