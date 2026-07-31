// /abalat/reports/monthly-attendance/page.tsx
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
      const response = await fetch('/api/abalat/reports/monthly-attendance', {
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
      const response = await fetch('/api/abalat/reports/monthly-attendance/download', {
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
    <div className="space-y-6 animate-fade-in pb-10">
      <Breadcrumb
        items={[
          { label: 'ሪፖርቶች', href: '/abalat/reports' },
          { label: 'ወርኃዊ አቴንዳንስ' },
        ]}
      />

      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          ወርኃዊ አቴንዳንስ ሪፖርት
        </h1>
        <p className="text-xs md:text-sm mt-1 text-[hsl(var(--muted-foreground))]">
          ለተመረጡ ወራት ዝርዝር አቴንዳንስ ሪፖርት (የተገኘ=1, ፈቃድ=0.5, ያልተገኘ=0)
        </p>
      </div>

      {/* Month Selection */}
      <div
        className="rounded-xl p-4 md:p-6 space-y-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
      >
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
          ወራትን ምረጡ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              ወር
            </label>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
            >
              <option value="">ወር ምረጥ...</option>
              {Object.values(ethMonthNames).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              ዓመት
            </label>
            <input
              type="number"
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
              placeholder={today.year.toString()}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
              min={2000}
              max={2100}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              የአቴንዳንስ ዐይነት
            </label>
            <select
              value={attendanceType}
              onChange={(e) => setAttendanceType(e.target.value as 'CHORE' | 'SUNDAY' | 'ALL')}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
            >
              <option value="ALL">ሁሉም ዐይነቶች</option>
              <option value="CHORE">የሠርክ አቴንዳንስ ብቻ</option>
              <option value="SUNDAY">የእሑድ ጉባዔ ብቻ</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={addMonth}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 bg-[hsl(160,40%,12%)] text-[hsl(160,60%,55%)] border border-[hsl(160,30%,20%)] hover:bg-[hsl(160,40%,16%)] active:scale-95"
            >
              <Plus size={16} />
              ጨምር
            </button>
          </div>
        </div>

        {selectedMonths.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedMonths.map((month, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] animate-fade-in"
              >
                {month.month} {month.year}
                <button
                  type="button"
                  onClick={() => removeMonth(index)}
                  className="hover:text-[hsl(var(--foreground))] transition-colors p-0.5 rounded-full hover:bg-[hsl(var(--accent))]"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={generateReport}
            disabled={selectedMonths.length === 0 || isGenerating}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-[hsl(160,70%,32%)] text-white hover:bg-[hsl(160,70%,36%)] active:scale-95"
          >
            {isGenerating && <Loader2 size={16} className="animate-spin" />}
            {isGenerating ? 'በማውጣት ላይ...' : 'ሪፖርት አውጣ'}
          </button>

          {reportData && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => downloadReport('pdf')}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 bg-[hsl(38,70%,32%)] text-white hover:bg-[hsl(38,70%,36%)] active:scale-95"
              >
                <Download size={16} />
                Download PDF
              </button>

              <button
                onClick={() => downloadReport('docx')}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 bg-[hsl(210,70%,32%)] text-white hover:bg-[hsl(210,70%,36%)] active:scale-95"
              >
                <Download size={16} />
                Download DOCX
              </button>
            </div>
          )}
        </div>

        {error && (
          <div
            className="rounded-lg p-3 text-sm font-medium bg-[hsl(0,40%,10%)] border border-[hsl(0,40%,22%)] text-[hsl(0,55%,62%)] animate-slide-in"
          >
            {error}
          </div>
        )}
      </div>

      {/* Report Table */}
      {reportData && (
        <div
          className="rounded-xl overflow-hidden bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                  <th className="px-4 py-4 text-left font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-[10px]">
                    ተ.ቁ.
                  </th>
                  <th className="px-4 py-4 text-left font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-[10px]">
                    ስም
                  </th>
                  {reportData.months.map((month) => (
                    <th
                      key={`${month.month}-${month.year}`}
                      className="px-4 py-4 text-center font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-[10px]"
                    >
                      {month.month} {month.year}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-center font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-[10px]">
                    አጠቃላይ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {reportData.data.map((member, index) => (
                  <tr
                    key={member.id}
                    className="hover:bg-[hsl(var(--accent)/0.5)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))] font-medium">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[hsl(var(--foreground))]">
                      {member.fullName || 'Unknown'}
                    </td>
                    {reportData.months.map((month) => {
                      const monthKey = `${month.month} ${month.year}`;
                      const count = member.monthlyAttendances[monthKey] || 0;
                      return (
                        <td
                          key={`${month.month}-${month.year}`}
                          className="px-4 py-3 text-center text-[hsl(var(--foreground))]"
                        >
                          {count}
                        </td>
                      );
                    })}
                    <td
                      className="px-4 py-3 text-center font-bold text-[hsl(160,60%,55%)] bg-[hsl(160,60%,55%)/0.03]"
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
