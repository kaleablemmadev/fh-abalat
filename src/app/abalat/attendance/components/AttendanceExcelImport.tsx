'use client';

import { useRef, useState } from 'react';
import { Download, Loader2, Upload } from 'lucide-react';

type Props = { type: 'chore' | 'sunday' };

export default function AttendanceExcelImport({ type }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const downloadTemplate = () => {
    window.location.href = `/api/abalat/attendance/import?type=${type}`;
  };

  const importAttendance = async (file: File) => {
    setIsBusy(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const response = await fetch('/api/abalat/attendance/import', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Attendance import failed');

      const dates = result.savedDates?.join('; ') || 'No new attendance records';
      setMessage(`New attendance saved: ${dates}${result.errors?.length ? ` (${result.errors.length} row issues)` : ''}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Attendance import failed');
    } finally {
      setIsBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={downloadTemplate}
        className="inline-flex items-center gap-1.5 rounded border px-3 py-2 text-xs font-medium"
        style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
      >
        <Download size={14} />
        Download {type === 'chore' ? 'Chore' : 'Sunday'} Template
      </button>
      <label
        className="inline-flex cursor-pointer items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold"
        style={{ background: 'hsl(160 70% 32%)', color: '#fff' }}
      >
        {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {isBusy ? 'Importing...' : 'Import Attendance'}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          disabled={isBusy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importAttendance(file);
          }}
        />
      </label>
      {message && (
        <span className="basis-full text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {message}
        </span>
      )}
    </div>
  );
}
