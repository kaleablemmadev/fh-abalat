'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CheckCircle2 } from 'lucide-react';

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

interface AttendanceGridProps {
  eventId: string;
  members: Member[];
  attendanceTypes: AttendanceType[];
  initialAttendance: InitialAttendance[];
}

export default function AttendanceGrid({
  eventId,
  members,
  attendanceTypes,
  initialAttendance,
}: AttendanceGridProps) {
  const router = useRouter();

  const [attendanceData, setAttendanceData] = useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    initialAttendance.forEach((record) => {
      initialState[record.memberId] = record.attendanceTypeId;
    });
    return initialState;
  });

  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const handleAttendanceChange = (memberId: string, attendanceTypeId: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [memberId]: attendanceTypeId,
    }));
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = Object.entries(attendanceData).map(([memberId, attendanceTypeId]) => ({
        memberId,
        attendanceTypeId,
      }));

      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to save attendance');
      }

      setSaveSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to determine pill color based on name (Attended = green, Permission = amber, Absent = red)
  const getPillColors = (name: string, isSelected: boolean) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('attended') || lowerName.includes('present') || lowerName === 'yes') {
      return isSelected 
        ? 'bg-emerald-500 text-white border-emerald-600' 
        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20';
    }
    if (lowerName.includes('permission') || lowerName.includes('excused') || lowerName === 'late') {
      return isSelected 
        ? 'bg-amber-500 text-white border-amber-600' 
        : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20';
    }
    if (lowerName.includes('absent') || lowerName === 'no') {
      return isSelected 
        ? 'bg-destructive text-white border-destructive' 
        : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20';
    }
    // Default
    return isSelected
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-accent/50 text-foreground border-border hover:bg-accent';
  };

  return (
    <div className="flex flex-col relative min-h-[50vh] pb-24">
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-slide-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4 font-medium text-muted-foreground w-1/3">Member Name</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-4 font-medium">{member.fullName || 'Unknown'}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {attendanceTypes.map((type) => {
                        const isSelected = attendanceData[member.id] === type.id;
                        const colorClass = getPillColors(type.name, isSelected);
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => handleAttendanceChange(member.id, type.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${colorClass}`}
                          >
                            {isSelected && <Check size={12} className="stroke-[3]" />}
                            {type.name}
                          </button>
                        );
                      })}
                    </div>
                  </td>
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
              <CheckCircle2 size={16} />
              <span>Saved successfully</span>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-6 shadow-sm"
        >
          {isSaving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
}
