// /abalat/attendance/components/MultiMonthGrid.tsx
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
  eventId: string;
  attendanceTypeId: string;
  permissionId: string | null;
}

interface Event {
  id: string;
  title: string;
  date: Date;
  ethDate: { year: number; month: string; day: number };
}

interface MultiMonthGridProps {
  events: Event[];
  members: Member[];
  attendanceTypes: AttendanceType[];
  initialAttendance: InitialAttendance[];
  autoFillRecords: Array<{ memberId: string; eventId: string; attendanceTypeId: string }>;
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
        color: 'hsl(160 65% 70%)',
        border: '1px solid hsl(160 40% 30%)',
      },
      unselected: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--muted-foreground))',
        border: '1px solid hsl(var(--border))',
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
        color: 'hsl(38 65% 65%)',
        border: '1px solid hsl(38 40% 28%)',
      },
      unselected: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--muted-foreground))',
        border: '1px solid hsl(var(--border))',
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
        color: 'hsl(0 55% 65%)',
        border: '1px solid hsl(0 40% 28%)',
      },
      unselected: {
        background: 'hsl(var(--card))',
        color: 'hsl(var(--muted-foreground))',
        border: '1px solid hsl(var(--border))',
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
      color: 'hsl(160 55% 60%)',
      border: '1px solid hsl(160 35% 25%)',
    },
    unselected: {
      background: 'hsl(var(--card))',
      color: 'hsl(var(--muted-foreground))',
      border: '1px solid hsl(var(--border))',
    },
    hoverBorder: 'hsl(160 40% 30%)',
  };
}

export default function MultiMonthGrid({
  events,
  members,
  attendanceTypes,
  initialAttendance,
  autoFillRecords,
  permissionTypeId,
  type,
  currentEthYear: _currentEthYear,
  currentEthMonth: _currentEthMonth,
}: MultiMonthGridProps) {
  // Initialize attendance data from existing records
  const [attendanceData, setAttendanceData] = useState<Record<string, { attendanceTypeId: string; permissionId: string | null }>>(() => {
    const initialState: Record<string, { attendanceTypeId: string; permissionId: string | null }> = {};

    // First, apply auto-fill records (permissions)
    autoFillRecords.forEach((record) => {
      const key = `${record.memberId}_${record.eventId}`;
      initialState[key] = {
        attendanceTypeId: record.attendanceTypeId,
        permissionId: null, // Permission context is handled via attendanceTypeId
      };
    });

    // Then, apply actual attendance records (they take precedence)
    initialAttendance.forEach((record) => {
      const key = `${record.memberId}_${record.eventId}`;
      initialState[key] = {
        attendanceTypeId: record.attendanceTypeId,
        permissionId: record.permissionId,
      };
    });
    return initialState;
  });

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [hasPermission, setHasPermission] = useState(false);
  const [memberId, setMemberId] = useState<string>('');

  const handleAttendanceChange = (memberId: string, eventId: string, attendanceTypeId: string) => {
    const key = `${memberId}_${eventId}`;
    setAttendanceData((prev) => ({
      ...prev,
      [key]: {
        attendanceTypeId,
        permissionId: null, // Always null — permissions are linked separately
      },
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = Object.entries(attendanceData).map(([key, value]) => {
        const [memberId, eventId] = key.split('_');
        setMemberId(memberId);
        return {
          memberId,
          eventId,
          attendanceTypeId: value.attendanceTypeId,
          permissionId: value.permissionId,
        };
      });

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      if (payload.length === 0) {
        setIsSaving(false);
        return;
      }

      const permission_res = await fetch(`/api/abalat/members/${memberId}/permission/`);
      const permission = await permission_res.json();
      if (permission) {
        setHasPermission(true)
      }

      

      const res = await fetch('/api/abalat/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json().catch(() => null);
      console.log("Server response:", res.status, responseData);

      if (!res.ok) {
        throw new Error(responseData?.error || responseData?.details || `Failed to save attendance (${res.status})`);
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
        className="rounded-xl overflow-hidden animate-slide-in bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
      >
        {members.length === 0 ? (
          <div
            className="p-12 text-center text-sm text-[hsl(var(--muted-foreground))]"
          >
            <Users size={32} className="mx-auto mb-4 opacity-20" />
            ምንም አባል አልተገኘም ፥ መጀመሪያ አባላትን መዝግብ
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[hsl(var(--border))]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                  <th
                    className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] sticky left-0 z-20 bg-[hsl(var(--muted))]"
                    style={{ minWidth: '160px' }}
                  >
                    አባል
                  </th>
                  {events.map((event) => (
                    <th
                      key={event.id}
                      className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-center border-l border-[hsl(var(--border))/0.5]"
                      style={{ minWidth: '120px' }}
                    >
                      {type === 'chore' ? 'Chore' : 'Sunday'}
                      <br />
                      <span className="text-[11px] font-semibold text-[hsl(var(--foreground))]">
                        {event.ethDate.month.substring(0, 3)} {event.ethDate.day}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-[hsl(var(--accent)/0.3)] transition-colors group"
                  >
                    <td
                      className="px-4 py-4 text-sm font-semibold text-[hsl(var(--foreground))] sticky left-0 z-10 bg-[hsl(var(--card))] group-hover:bg-[hsl(var(--accent)/0.5)] transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.1)] md:shadow-none"
                    >
                      {member.fullName || 'Unknown'}
                    </td>
                    {events.map((event) => {
                      const key = `${member.id}_${event.id}`;
                      const currentAttendance = attendanceData[key];
                      return (
                        <td key={event.id} className="px-4 py-3 text-center border-l border-[hsl(var(--border))/0.5]">
                          <div className="flex gap-2 justify-center">
                            {attendanceTypes.filter(t => t.name.toLowerCase() !== 'late').map((t) => {
                              const isSelected = currentAttendance?.attendanceTypeId === t.id;
                              const props = getPillStyle(t.name);

                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => handleAttendanceChange(member.id, event.id, t.id)}
                                  title={t.name}
                                  className={`
                                    w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90
                                    ${isSelected
                                      ? 'shadow-inner scale-105'
                                      : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--accent))]'
                                    }
                                  `}
                                  style={isSelected ? props.selected : {}}
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

      {/* ── Save bar ───────────────────────────────────────────── */}
      <div
        className="mt-8 px-4 py-4 md:px-6 md:py-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg"
      >
        {/* Status messages */}
        <div className="flex items-center gap-3">
          {error && (
            <p
              className="text-sm font-semibold text-[hsl(0,55%,62%)] animate-slide-in"
            >
              {error}
            </p>
          )}
          {saveSuccess && (
            <div
              className="flex items-center gap-2 text-sm font-semibold text-[hsl(160,55%,58%)] animate-slide-in"
            >
              <CheckCircle2 size={18} />
              <span>አቴንዳንስ ተመዝግቧል</span>
            </div>
          )}
          {!error && !saveSuccess && (
            <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
              <Users size={16} />
              <span className="text-xs font-medium">{members.length} አባላት ተመርጠዋል</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[hsl(160,70%,32%)] text-white hover:bg-[hsl(160,70%,36%)] active:scale-95 shadow-md hover:shadow-lg shadow-[hsl(160,70%,32%)/0.2]"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? 'ምዝገባ ላይ…' : 'አቴንዳንስ መዝግብ'}
        </button>
      </div>
    </div>
  );
}
