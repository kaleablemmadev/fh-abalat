// /course/attendance/[classId]/components/CourseAttendanceGrid.tsx
'use client'

import { useState, useEffect } from 'react';
import { Check, CheckCircle2, Loader2, X, Clock, Users, Save } from 'lucide-react';

interface Student {
  id: string;
  fullName: string | null;
}

interface AttendanceType {
  id: string;
  name: string;
  value: number;
}

interface Event {
  id: string;
  date: Date;
  ethiopianYear: number;
  ethiopianMonth: number;
  ethiopianDay: number;
}

interface AttendanceRecord {
  id: string;
  memberId: string;
  eventId: string;
  attendanceTypeId: string;
}

interface CourseAttendanceGridProps {
  classId: string;
  students: Student[];
  attendanceTypes: AttendanceType[];
  events: Event[];
  initialAttendance: AttendanceRecord[];
}

/** Map an attendance type name to its visual pill properties */
function getPillStyle(name: string) {
  const n = name.toLowerCase();

  if (n.includes('attended') || n.includes('present') || n === 'yes') {
    return {
      letter: '✓',
      icon: <Check size={11} strokeWidth={3} />,
      selected: {
        background: 'hsl(200 40% 18%)',
        color:      'hsl(200 65% 70%)',
        border:     '1px solid hsl(200 40% 30%)',
      },
      unselected: {
        background: 'hsl(var(--card))',
        color:      'hsl(var(--muted-foreground))',
        border:     '1px solid hsl(var(--border))',
      },
      hoverBorder: 'hsl(200 50% 35%)',
    };
  }

  if (n.includes('permission') || n.includes('excused') || n === 'late') {
    return {
      letter: 'P',
      icon: <Clock size={11} strokeWidth={2.5} />,
      selected: {
        background: 'hsl(38 35% 16%)',
        color:      'hsl(38 65% 65%)',
        border:     '1px solid hsl(38 40% 28%)',
      },
      unselected: {
        background: 'hsl(var(--card))',
        color:      'hsl(var(--muted-foreground))',
        border:     '1px solid hsl(var(--border))',
      },
      hoverBorder: 'hsl(38 45% 35%)',
    };
  }

  if (n.includes('absent') || n === 'no') {
    return {
      letter: '✗',
      icon: <X size={11} strokeWidth={3} />,
      selected: {
        background: 'hsl(0 40% 16%)',
        color:      'hsl(0 55% 65%)',
        border:     '1px solid hsl(0 40% 28%)',
      },
      unselected: {
        background: 'hsl(var(--card))',
        color:      'hsl(var(--muted-foreground))',
        border:     '1px solid hsl(var(--border))',
      },
      hoverBorder: 'hsl(0 45% 35%)',
    };
  }

  // Default / unknown
  return {
    letter: '?',
    icon: null,
    selected: {
      background: 'hsl(200 40% 14%)',
      color:      'hsl(200 55% 60%)',
      border:     '1px solid hsl(200 35% 25%)',
    },
    unselected: {
      background: 'hsl(var(--card))',
      color:      'hsl(var(--muted-foreground))',
      border:     '1px solid hsl(var(--border))',
    },
    hoverBorder: 'hsl(200 45% 30%)',
  };
}

export default function CourseAttendanceGrid({
  classId,
  students,
  attendanceTypes,
  events,
  initialAttendance,
}: CourseAttendanceGridProps) {
  // State: Record<eventId, Record<studentId, attendanceTypeId>>
  const [attendanceState, setAttendanceState] = useState<Record<string, Record<string, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Initialize state from initial attendance
  useEffect(() => {
    const initialState: Record<string, Record<string, string>> = {};
    
    // Initialize all events with empty student records
    events.forEach((event) => {
      initialState[event.id] = {};
    });

    // Fill in existing attendance
    initialAttendance.forEach((record) => {
      if (initialState[record.eventId]) {
        initialState[record.eventId][record.memberId] = record.attendanceTypeId;
      }
    });

    setAttendanceState(initialState);
  }, [events, initialAttendance]);

  const handleAttendanceChange = (eventId: string, studentId: string, attendanceTypeId: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [studentId]: attendanceTypeId,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Flatten the state into an array of attendance records
      const attendanceUpdates: Array<{
        eventId: string;
        memberId: string;
        attendanceTypeId: string;
      }> = [];

      Object.entries(attendanceState).forEach(([eventId, studentRecords]) => {
        Object.entries(studentRecords).forEach(([studentId, attendanceTypeId]) => {
          attendanceUpdates.push({
            eventId,
            memberId: studentId,
            attendanceTypeId,
          });
        });
      });

      const res = await fetch('/api/course/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceUpdates),
      });

      if (!res.ok) {
        throw new Error('Failed to save attendance');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const formatEthiopianDate = (event: Event) => {
    return `${event.ethiopianMonth} ${event.ethiopianDay}`;
  };

  const hasChanges = () => {
    // Compare current state with initial state
    const initialState: Record<string, Record<string, string>> = {};
    events.forEach((event) => {
      initialState[event.id] = {};
    });
    initialAttendance.forEach((record) => {
      if (initialState[record.eventId]) {
        initialState[record.eventId][record.memberId] = record.attendanceTypeId;
      }
    });

    return JSON.stringify(attendanceState) !== JSON.stringify(initialState);
  };

  if (events.length === 0) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <Users
          size={24}
          className="mx-auto mb-2"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        />
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          No events scheduled for this class yet.
        </p>
        <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Generate course events to start taking attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  background: 'hsl(var(--muted))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <th
                  className="sticky left-0 px-3 py-2 text-left font-semibold z-10"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--foreground))',
                    minWidth: '150px',
                  }}
                >
                  Student
                </th>
                {events.map((event) => (
                  <th
                    key={event.id}
                    className="px-3 py-2 text-center font-semibold whitespace-nowrap"
                    style={{
                      color: 'hsl(var(--foreground))',
                      minWidth: '80px',
                    }}
                  >
                    <div>{formatEthiopianDate(event)}</div>
                    <div
                      className="text-[10px]"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      {event.ethiopianYear}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  style={{ borderBottom: '1px solid hsl(var(--border))' }}
                >
                  <td
                    className="sticky left-0 px-3 py-2 z-10"
                    style={{
                      background: 'hsl(var(--card))',
                      color: 'hsl(var(--foreground))',
                      minWidth: '150px',
                    }}
                  >
                    {student.fullName || 'Unnamed student'}
                  </td>
                  {events.map((event) => {
                    const currentAttendanceTypeId = attendanceState[event.id]?.[student.id];
                    const style = currentAttendanceTypeId
                      ? getPillStyle(attendanceTypes.find((t) => t.id === currentAttendanceTypeId)?.name || '')
                      : null;

                    return (
                      <td key={event.id} className="px-2 py-2 text-center">
                        <div className="flex justify-center gap-1">
                          {attendanceTypes.map((type) => {
                            const pillStyle = getPillStyle(type.name);
                            const isSelected = currentAttendanceTypeId === type.id;

                            return (
                              <button
                                key={type.id}
                                onClick={() => handleAttendanceChange(event.id, student.id, type.id)}
                                className="w-7 h-7 rounded flex items-center justify-center transition-all duration-150"
                                style={{
                                  ...(isSelected ? pillStyle.selected : pillStyle.unselected),
                                  border: isSelected
                                    ? pillStyle.selected.border
                                    : pillStyle.unselected.border,
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = pillStyle.hoverBorder;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = pillStyle.unselected.border;
                                  }
                                }}
                                title={type.name}
                              >
                                {isSelected && style?.icon ? style.icon : pillStyle.letter}
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

      {/* Sticky Save Bar */}
      <div
        className="sticky bottom-4 rounded-lg p-3 flex items-center justify-between gap-3"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Users size={14} />
          <span>{students.length} students</span>
          <span>•</span>
          <span>{events.length} events</span>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(160 65% 60%)' }}>
              <CheckCircle2 size={14} />
              Saved
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(0 55% 60%)' }}>
              Failed to save
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold transition-colors duration-150"
            style={{
              background: isSaving || !hasChanges()
                ? 'hsl(200 70% 25%)'
                : 'hsl(200 70% 32%)',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              if (!isSaving && hasChanges()) {
                e.currentTarget.style.background = 'hsl(200 70% 38%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving && hasChanges()) {
                e.currentTarget.style.background = 'hsl(200 70% 32%)';
              }
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={12} />
                Save Attendance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
