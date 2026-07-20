'use client';

import { useState } from 'react';
import { Check, CheckCircle2, Loader2, X, Clock, Users } from 'lucide-react';

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
  permissionId: string | null;
}

interface Event {
  id: string;
  title: string;
  date: Date;
  ethDate: { day: number };
}

interface MultiMonthGridProps {
  events: Event[];
  members: Member[];
  attendanceTypes: AttendanceType[];
  initialAttendance: InitialAttendance[];
  permissionTypeId: string | null;
  type: string;
  currentEthYear: number;
  currentEthMonth: number;
}

/** Map an attendance type name to its visual pill properties */
function getPillStyle(name: string) {
  const n = name.toLowerCase();

  if (n.includes('attended') || n.includes('present') || n === 'yes') {
    return {
      letter: '✓',
      icon: <Check size={11} strokeWidth={3} />,
      selected: {
        background: 'hsl(160 40% 18%)',
        color:      'hsl(160 65% 70%)',
        border:     '1px solid hsl(160 40% 30%)',
      },
      unselected: {
        background: 'hsl(var(--card))',
        color:      'hsl(var(--muted-foreground))',
        border:     '1px solid hsl(var(--border))',
      },
      hoverBorder: 'hsl(160 50% 35%)',
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
      background: 'hsl(160 40% 14%)',
      color:      'hsl(160 55% 60%)',
      border:     '1px solid hsl(160 35% 25%)',
    },
    unselected: {
      background: 'hsl(var(--card))',
      color:      'hsl(var(--muted-foreground))',
      border:     '1px solid hsl(var(--border))',
    },
    hoverBorder: 'hsl(160 40% 30%)',
  };
}

export default function MultiMonthGrid({
  events,
  members,
  attendanceTypes,
  initialAttendance,
  permissionTypeId,
  type,
  currentEthYear,
  currentEthMonth,
}: MultiMonthGridProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, { attendanceTypeId: string; permissionId: string | null }>>(() => {
    const initialState: Record<string, { attendanceTypeId: string; permissionId: string | null }> = {};
    initialAttendance.forEach((record) => {
      initialState[`${record.memberId}_${record.eventId}`] = {
        attendanceTypeId: record.attendanceTypeId,
        permissionId: record.permissionId,
      };
    });
    return initialState;
  });

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAttendanceChange = (memberId: string, eventId: string, attendanceTypeId: string) => {
    const key = `${memberId}_${eventId}`;
    const isPermission = attendanceTypeId === permissionTypeId;
    setAttendanceData((prev) => ({
      ...prev,
      [key]: {
        attendanceTypeId,
        permissionId: isPermission ? memberId : null,
      },
    }));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = Object.entries(attendanceData).map(([key, value]) => {
        const [memberId, eventId] = key.split('_');
        return {
          memberId,
          eventId,
          attendanceTypeId: value.attendanceTypeId,
          permissionId: value.permissionId,
        };
      });

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to save attendance');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col relative pb-20">
      {/* ── Attendance table ──────────────────────────────────────────── */}
      <div
        className="rounded-lg overflow-hidden animate-slide-in"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {members.length === 0 ? (
          <div
            className="p-10 text-center text-sm"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <Users size={20} className="mx-auto mb-2" style={{ color: 'hsl(var(--muted-foreground))' }} />
            No members found. Add members first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <th
                    className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider sticky left-0"
                    style={{
                      background: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                      minWidth: '150px',
                    }}
                  >
                    Member
                  </th>
                  {events.map((event) => (
                    <th
                      key={event.id}
                      className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-center"
                      style={{
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        minWidth: '100px',
                      }}
                    >
                      Day {event.ethDate.day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr
                    key={member.id}
                    className="transition-colors duration-100"
                    style={{
                      borderBottom: idx < members.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--accent))')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td
                      className="px-4 py-2.5 text-sm font-medium sticky left-0"
                      style={{ 
                        background: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      {member.fullName || 'Unknown'}
                    </td>
                    {events.map((event) => {
                      const key = `${member.id}_${event.id}`;
                      const currentAttendance = attendanceData[key];
                      return (
                        <td key={event.id} className="px-3 py-2 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {attendanceTypes.map((type) => {
                              const isSelected = currentAttendance?.attendanceTypeId === type.id;
                              const props = getPillStyle(type.name);
                              const styleNow = isSelected ? props.selected : props.unselected;

                              return (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() => handleAttendanceChange(member.id, event.id, type.id)}
                                  title={type.name}
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-all duration-150"
                                  style={styleNow}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.borderColor = props.hoverBorder;
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.borderColor = 'hsl(var(--border))';
                                  }}
                                >
                                  {props.icon}
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
        )}
      </div>

      {/* ── Sticky save bar ───────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 md:left-56 right-0 px-5 py-3 z-40 flex items-center justify-between"
        style={{
          background: 'hsl(var(--card))',
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
        {/* Status messages */}
        <div className="flex items-center gap-3">
          {error && (
            <p
              className="text-sm font-medium animate-slide-in"
              style={{ color: 'hsl(0 55% 62%)' }}
            >
              {error}
            </p>
          )}
          {saveSuccess && (
            <div
              className="flex items-center gap-1.5 text-sm font-medium animate-slide-in"
              style={{ color: 'hsl(160 55% 58%)' }}
            >
              <CheckCircle2 size={15} />
              <span>Saved successfully</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'hsl(160 70% 32%)',
            color: '#fff',
          }}
          onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.background = 'hsl(160 70% 38%)'; }}
          onMouseLeave={(e) => { if (!isSaving) e.currentTarget.style.background = 'hsl(160 70% 32%)'; }}
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? 'Saving…' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
}