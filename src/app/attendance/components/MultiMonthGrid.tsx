/* /attendance/components/MultiMonthGrid.tsx */
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, HelpCircle, Loader2, Users } from 'lucide-react';

interface Member {
  id: string;
  fullName: string | null;
}

interface Event {
  id: string;
  title: string;
  date: Date;
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

interface MultiMonthGridProps {
  events: Event[];
  members: Member[];
  attendanceTypes: AttendanceType[];
  initialAttendance: InitialAttendance[];
  permissionTypeId: string | null;
}

/** Per-cell button visual props based on attendance type name */
function getCellProps(name: string, isSelected: boolean, isDisabled: boolean) {
  const n = name.toLowerCase();

  if (isDisabled) {
    return {
      letter: isSelected ? '✓' : '·',
      icon: null as React.ReactNode,
      style: {
        background: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground) / 0.3)',
        border: '1px solid transparent',
        opacity: 0.4,
        cursor: 'not-allowed',
      },
    };
  }

  if (n.includes('attended') || n.includes('present') || n === 'yes') {
    return {
      letter: '✓',
      icon: <Check size={12} strokeWidth={3} />,
      style: isSelected
        ? { background: 'hsl(160 40% 18%)', color: 'hsl(160 65% 70%)', border: '1px solid hsl(160 40% 30%)', cursor: 'pointer' }
        : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', cursor: 'pointer' },
      hoverStyle: !isSelected ? { borderColor: 'hsl(160 50% 35%)' } : {},
    };
  }
  if (n.includes('permission') || n.includes('excused') || n === 'late') {
    return {
      letter: 'P',
      icon: <Clock size={12} strokeWidth={2.5} />,
      style: isSelected
        ? { background: 'hsl(38 35% 16%)', color: 'hsl(38 65% 65%)', border: '1px solid hsl(38 40% 28%)', cursor: 'pointer' }
        : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', cursor: 'pointer' },
      hoverStyle: !isSelected ? { borderColor: 'hsl(38 45% 35%)' } : {},
    };
  }
  if (n.includes('absent') || n === 'no') {
    return {
      letter: '✗',
      icon: <X size={12} strokeWidth={3} />,
      style: isSelected
        ? { background: 'hsl(0 40% 16%)', color: 'hsl(0 55% 65%)', border: '1px solid hsl(0 40% 28%)', cursor: 'pointer' }
        : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', cursor: 'pointer' },
      hoverStyle: !isSelected ? { borderColor: 'hsl(0 45% 35%)' } : {},
    };
  }
  return {
    letter: '?',
    icon: <HelpCircle size={12} />,
    style: isSelected
      ? { background: 'hsl(160 40% 14%)', color: 'hsl(160 55% 60%)', border: '1px solid hsl(160 35% 25%)', cursor: 'pointer' }
      : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))', cursor: 'pointer' },
    hoverStyle: !isSelected ? { borderColor: 'hsl(160 40% 30%)' } : {},
  };
}

export default function MultiMonthGrid({
  events,
  members,
  attendanceTypes,
  initialAttendance,
  permissionTypeId,
}: MultiMonthGridProps) {
  const router = useRouter();
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  
  const [gridData, setGridData] = useState<Record<string, Record<string, string>>>(() => {
    const initialState: Record<string, Record<string, string>> = {};
    members.forEach(m => { initialState[m.id] = {}; });
    initialAttendance.forEach((record) => {
      if (!initialState[record.memberId]) initialState[record.memberId] = {};
      initialState[record.memberId][record.eventId] = record.attendanceTypeId;
    });
    return initialState;
  });

  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAttendanceChange = (memberId: string, eventId: string, attendanceTypeId: string) => {
    setGridData((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [eventId]: attendanceTypeId,
      }
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload: { memberId: string, eventId: string, attendanceTypeId: string }[] = [];
      Object.entries(gridData).forEach(([memberId, eventsData]) => {
        Object.entries(eventsData).forEach(([eventId, attendanceTypeId]) => {
          if (attendanceTypeId) payload.push({ memberId, eventId, attendanceTypeId });
        });
      });

      if (payload.length === 0) {
        setIsSaving(false);
        return;
      }

      const res = await fetch(`/api/attendance/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to bulk save attendance');
      }

      setSaveSuccess(true);
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const isFutureEvent = (date: Date) => new Date(date).getTime() > new Date().getTime();

  return (
    <div className="flex flex-col relative pb-20">
      {/* ── Grid table ───────────────────────────────────────────────── */}
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
            <Users size={20} className="mx-auto mb-2" />
            No members found.
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: '72vh' }}>
            <table className="border-collapse text-sm" style={{ minWidth: '100%' }}>
              {/* Sticky header */}
              <thead className="sticky top-0 z-20">
                <tr>
                  {/* Sticky member-name corner cell */}
                  <th
                    className="sticky left-0 z-30 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{
                      background: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                      borderRight: '1px solid hsl(var(--border))',
                      borderBottom: '1px solid hsl(var(--border))',
                      minWidth: '180px',
                    }}
                  >
                    Member
                  </th>

                  {/* Date column headers */}
                  {sortedEvents.map((event) => (
                    <th
                      key={event.id}
                      className="px-2 py-2.5 text-center text-[11px] font-medium whitespace-nowrap"
                      style={{
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        borderLeft: '1px solid hsl(var(--border))',
                        borderBottom: '1px solid hsl(var(--border))',
                        minWidth: '80px',
                      }}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span style={{ color: 'hsl(var(--foreground))' }}>
                          {new Date(event.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider opacity-60">
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {members.map((member, rowIdx) => (
                  <tr
                    key={member.id}
                    className="transition-colors duration-100"
                    style={{
                      borderBottom:
                        rowIdx < members.length - 1
                          ? '1px solid hsl(var(--border))'
                          : 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Sticky member name */}
                    <td
                      className="sticky left-0 z-10 px-3 py-2 text-sm font-medium whitespace-nowrap"
                      style={{
                        background: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                        borderRight: '1px solid hsl(var(--border))',
                      }}
                    >
                      {member.fullName || 'Unknown'}
                    </td>

                    {/* Per-event cells */}
                    {sortedEvents.map((event) => {
                      const isFuture = isFutureEvent(event.date);

                      return (
                        <td
                          key={event.id}
                          className="p-1.5 text-center align-middle"
                          style={{ borderLeft: '1px solid hsl(var(--border))' }}
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            {attendanceTypes.map((type) => {
                              const isSelected = gridData[member.id]?.[event.id] === type.id;
                              const isPermissionType =
                                type.id === permissionTypeId ||
                                type.name.toLowerCase().includes('permission');
                              const isDisabled = isFuture && !isPermissionType;
                              const cell = getCellProps(type.name, isSelected, isDisabled);

                              return (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() =>
                                    handleAttendanceChange(member.id, event.id, type.id)
                                  }
                                  disabled={isDisabled}
                                  title={
                                    isDisabled
                                      ? 'Cannot mark regular attendance for future events'
                                      : type.name
                                  }
                                  className="flex items-center justify-center w-7 h-7 rounded transition-all duration-100"
                                  style={cell.style}
                                  onMouseEnter={(e) => {
                                    if (!isDisabled && !isSelected && cell.hoverStyle) {
                                      Object.assign(e.currentTarget.style, cell.hoverStyle);
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isDisabled && !isSelected) {
                                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                                    }
                                  }}
                                >
                                  {cell.icon}
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
        className="bottom-0 left-0 md:left-56 right-0 px-5 py-3 z-40 flex items-center justify-between"
        style={{
          background: 'hsl(var(--card))',
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
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
              <Check size={14} strokeWidth={3} />
              <span>Bulk saved successfully</span>
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
          {isSaving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
