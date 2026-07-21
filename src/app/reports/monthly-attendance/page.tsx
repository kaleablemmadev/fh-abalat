// src/app/reports/monthly-attendance/page.tsx
'use client';

import { useState } from 'react';
import { Plus, X, Download, Loader2 } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import { ethMonthNames, getEthiopianToday } from '@/src/lib/ethiopiancal';

interface MonthSelection {
  month: string;
  year: number;
}

interface MemberAttendanceData {
  id: string;
  fullName: string | null;
  monthlyAttendances: Record<string, number>;
  total: number;
}

export default function MonthlyAttendanceReportPage() {
  const [selectedMonths, setSelectedMonths] = useState<MonthSelection[]>([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [attendanceType, setAttendanceType] = useState<'CHORE' | 'SUNDAY' | 'ALL'>('ALL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<{ months: MonthSelection[]; data: MemberAttendanceData[]; attendanceType: string } | null>(null);
  const [error, setError] = useState('');

  const today = getEthiopianToday();

  const addMonth = () => {
    if (!currentMonth || !currentYear) {
      setError('Please select both month and year');
      return;
    }

    const monthKey = `${currentMonth} ${currentYear}`;
    if (selectedMonths.some(m => `${m.month} ${m.year}` === monthKey)) {
      setError('This month is already selected');
      return;
    }

    setSelectedMonths([...selectedMonths, { month: currentMonth, year: parseInt(currentYear) }]);
    setCurrentMonth('');
    setCurrentYear('');
    setError('');
  };

  const removeMonth = (index: number) => {
    setSelectedMonths(selectedMonths.filter((_, i) => i !== index));
  };

  const generateReport = async () => {
    if (selectedMonths.length === 0) {
      setError('Please select at least one month');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/reports/monthly-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: selectedMonths, attendanceType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'docx' = 'pdf') => {
    if (!reportData) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/monthly-attendance/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months: reportData.months,
          data: reportData.data,
          attendanceType: reportData.attendanceType,
          format
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${format.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to download ${format.toUpperCase()}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Reports', href: '/reports' },
          { label: 'Monthly Attendance' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Monthly Attendance Report
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Generate attendance reports for specific months (Attended=1, Excused=0.5, Absent=0)
        </p>
      </div>

      {/* Month Selection */}
      <div
        className="rounded-lg p-6 space-y-4"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Select Months
        </h2>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
              Month
            </label>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <option value="">Select month...</option>
              {Object.values(ethMonthNames).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <label className="block text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
              Year
            </label>
            <input
              type="number"
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              placeholder={today.year.toString()}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              min={2000}
              max={2100}
            />
          </div>

          <div className="w-40">
            <label className="block text-sm font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
              Attendance Type
            </label>
            <select
              value={attendanceType}
              onChange={(e) => setAttendanceType(e.target.value as 'CHORE' | 'SUNDAY' | 'ALL')}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <option value="ALL">All Types</option>
              <option value="CHORE">Chore Only</option>
              <option value="SUNDAY">Sunday Only</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={addMonth}
              className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150"
              style={{
                background: 'hsl(160 40% 12%)',
                color: 'hsl(160 60% 55%)',
                border: '1px solid hsl(160 30% 20%)',
              }}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        {selectedMonths.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedMonths.map((month, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
                style={{
                  background: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                {month.month} {month.year}
                <button
                  type="button"
                  onClick={() => removeMonth(index)}
                  className="hover:text-[hsl(var(--foreground))]"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={generateReport}
            disabled={selectedMonths.length === 0 || isGenerating}
            className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
            style={{
              background: 'hsl(160 70% 32%)',
              color: '#fff',
            }}
          >
            {isGenerating && <Loader2 size={14} className="animate-spin" />}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>

          {reportData && (
            <div className="flex gap-2">
              <button
                onClick={() => downloadReport('pdf')}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
                style={{
                  background: 'hsl(38 70% 32%)',
                  color: '#fff',
                }}
              >
                <Download size={14} />
                Download PDF
              </button>

              <button
                onClick={() => downloadReport('docx')}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
                style={{
                  background: 'hsl(210 70% 32%)',
                  color: '#fff',
                }}
              >
                <Download size={14} />
                Download DOCX
              </button>
            </div>
          )}
        </div>

        {error && (
          <div
            className="rounded p-3 text-sm font-medium"
            style={{
              background: 'hsl(0 40% 10%)',
              border: '1px solid hsl(0 40% 22%)',
              color: 'hsl(0 55% 62%)',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Report Table */}
      {reportData && (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'hsl(var(--muted))' }}>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    No.
                  </th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Name
                  </th>
                  {reportData.months.map((month) => (
                    <th
                      key={`${month.month}-${month.year}`}
                      className="px-4 py-3 text-center font-semibold"
                      style={{ color: 'hsl(var(--foreground))' }}
                    >
                      {month.month} {month.year}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((member, index) => (
                  <tr
                    key={member.id}
                    style={{ borderBottom: '1px solid hsl(var(--border))' }}
                  >
                    <td className="px-4 py-3" style={{ color: 'hsl(var(--foreground))' }}>
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                      {member.fullName || 'Unknown'}
                    </td>
                    {reportData.months.map((month) => {
                      const monthKey = `${month.month} ${month.year}`;
                      const count = member.monthlyAttendances[monthKey] || 0;
                      return (
                        <td
                          key={`${month.month}-${month.year}`}
                          className="px-4 py-3 text-center"
                          style={{ color: 'hsl(var(--foreground))' }}
                        >
                          {count}
                        </td>
                      );
                    })}
                    <td
                      className="px-4 py-3 text-center font-bold"
                      style={{ color: 'hsl(160 60% 55%)' }}
                    >
                      {member.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
