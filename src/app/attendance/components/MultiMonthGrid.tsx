'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, HelpCircle, Loader2 } from 'lucide-react';

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

export default function MultiMonthGrid({
  events,
  members,
  attendanceTypes,
  initialAttendance,
  permissionTypeId,
}: MultiMonthGridProps) {
  const router = useRouter();
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
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

  // Helper for pill icons/colors
  const getTypeProps = (name: string, isSelected: boolean) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('attended') || lowerName.includes('present')) {
      return {
        icon: <Check size={14} className={isSelected ? 'stroke-[3]' : ''} />,
        label: 'A',
        colorClass: isSelected ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
      };
    }
    if (lowerName.includes('permission') || lowerName.includes('excused')) {
      return {
        icon: <Clock size={14} className={isSelected ? 'stroke-[3]' : ''} />,
        label: 'P',
        colorClass: isSelected ? 'bg-amber-500 text-white border-amber-600' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
      };
    }
    if (lowerName.includes('absent')) {
      return {
        icon: <X size={14} className={isSelected ? 'stroke-[3]' : ''} />,
        label: 'X',
        colorClass: isSelected ? 'bg-destructive text-white border-destructive' : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
      };
    }
    return {
      icon: <HelpCircle size={14} />,
      label: '?',
      colorClass: isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent/50 text-foreground border-border hover:bg-accent'
    };
  };

  return (
    <div className="flex flex-col relative min-h-[50vh] pb-24">
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-slide-in">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-20 shadow-[0_1px_0_0_rgba(255,255,255,0.1)]">
              <tr className="bg-muted">
                <th className="p-4 font-medium text-muted-foreground min-w-[200px] sticky left-0 z-30 bg-muted border-r border-border shadow-[1px_0_0_0_rgba(255,255,255,0.1)]">
                  Member Name
                </th>
                {sortedEvents.map((event) => (
                  <th key={event.id} className="p-4 font-medium text-muted-foreground whitespace-nowrap min-w-[120px] text-center border-l border-border/50">
                    <div className="flex flex-col items-center">
                      <span className="text-foreground">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-4 font-medium sticky left-0 bg-card z-10 border-r border-border shadow-[1px_0_0_0_rgba(0,0,0,0.1)] group-hover:bg-muted/30">
                    {member.fullName || 'Unknown'}
                  </td>
                  {sortedEvents.map((event) => {
                    const isFuture = isFutureEvent(event.date);
                    
                    return (
                      <td key={event.id} className="p-2 border-l border-border/50 align-middle">
                        <div className="flex items-center justify-center gap-1">
                          {attendanceTypes.map((type) => {
                            const isSelected = gridData[member.id]?.[event.id] === type.id;
                            const isPermissionType = type.id === permissionTypeId || type.name.toLowerCase().includes('permission');
                            const isDisabled = isFuture && !isPermissionType;
                            const props = getTypeProps(type.name, isSelected);

                            return (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => handleAttendanceChange(member.id, event.id, type.id)}
                                disabled={isDisabled}
                                title={isDisabled ? "Cannot mark regular attendance for future events" : type.name}
                                className={`flex items-center justify-center w-8 h-8 rounded-md transition-all border ${
                                  isDisabled 
                                    ? 'bg-muted/50 text-muted-foreground/30 border-transparent cursor-not-allowed opacity-50' 
                                    : props.colorClass
                                }`}
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
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-40 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
          {error && <p className="text-sm font-medium text-destructive animate-slide-in">{error}</p>}
          {saveSuccess && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-500 animate-slide-in">
              <Check size={16} />
              <span>Bulk saved successfully</span>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-6 shadow-sm"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? 'Saving Grid...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
