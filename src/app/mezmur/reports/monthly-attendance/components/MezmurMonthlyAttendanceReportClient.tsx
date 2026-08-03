"use client";

import { useState } from "react";
import { Plus, X, Download, Loader2 } from "lucide-react";
import { ethMonthNames } from "@/src/lib/ethiopiancal";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, HeadingLevel, AlignmentType, WidthType } from "docx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface MonthSelection {
  month: string;
  year: number;
}

interface MemberAttendanceData {
  id: string;
  fullName: string | null;
  privateId: string | null;
  monthlyAttendances: Record<string, number>;
  total: number;
}

interface Event {
  id: string;
  title: string;
  ethiopianYear: number | null;
  ethiopianMonth: number | null;
  ethiopianDay: number | null;
  attendances: {
    memberId: string;
    attendanceType: {
      value: number;
    };
    permission: {
      status: string;
    } | null;
  }[];
}

interface MezmurMonthlyAttendanceReportClientProps {
  members: {
    id: string;
    fullName: string | null;
    privateId: string | null;
    memberType: string;
  }[];
  events: Event[];
  currentEthiopianDate: { year: number; month: string; day: number };
}

export default function MezmurMonthlyAttendanceReportClient({ 
  members, 
  events, 
  currentEthiopianDate 
}: MezmurMonthlyAttendanceReportClientProps) {
  const [selectedMonths, setSelectedMonths] = useState<MonthSelection[]>([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<{ 
    months: MonthSelection[]; 
    data: MemberAttendanceData[] 
  } | null>(null);
  const [error, setError] = useState('');

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

  const generateReport = () => {
    if (selectedMonths.length === 0) {
      setError('Please select at least one month');
      return;
    }

    const attendanceData: MemberAttendanceData[] = members.map(member => {
      const monthlyAttendances: Record<string, number> = {};
      let total = 0;

      selectedMonths.forEach(monthSelection => {
        const monthKey = `${monthSelection.month} ${monthSelection.year}`;
        
        // Find month number from Ethiopian month name
        let monthNumber = 1;
        for (const [key, value] of Object.entries(ethMonthNames)) {
          if (value === monthSelection.month) {
            monthNumber = parseInt(key);
            break;
          }
        }

        // Filter events for this month and year
        const monthEvents = events.filter(
          e => e.ethiopianMonth === monthNumber && e.ethiopianYear === monthSelection.year
        );

        // Calculate attendance for this member
        let monthTotal = 0;
        monthEvents.forEach(event => {
          const attendance = event.attendances.find(a => a.memberId === member.id);
          if (attendance) {
            if (attendance.permission?.status === 'APPROVED') {
              monthTotal += 0.5;
            } else {
              monthTotal += attendance.attendanceType.value;
            }
          }
        });

        monthlyAttendances[monthKey] = monthTotal;
        total += monthTotal;
      });

      return {
        id: member.id,
        fullName: member.fullName,
        privateId: member.privateId,
        monthlyAttendances,
        total
      };
    });

    setReportData({
      months: selectedMonths,
      data: attendanceData
    });
  };

  const downloadReport = async (format: 'pdf' | 'docx' = 'pdf') => {
    if (!reportData) return;

    setIsGenerating(true);
    try {
      if (format === 'docx') {
        await generateDOCX(reportData);
      } else {
        await generatePDF(reportData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to download ${format.toUpperCase()}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDOCX = async (data: { months: MonthSelection[]; data: MemberAttendanceData[] }) => {
    const { months, data: attendanceData } = data;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 500, bottom: 500, left: 500, right: 500 }
          }
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'የወርኃዊ አቴንዳንስ ሪፖርት', size: 32, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `የተዘጋጀው በ: ${new Date().toLocaleDateString()}`, size: 18 })],
            spacing: { after: 150 }
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'ተ.ቁ.', bold: true, size: 18 })] })],
                    width: { size: 5, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'ስም', bold: true, size: 18 })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE }
                  }),
                  ...months.map(m => new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: `${m.month} ${m.year}`, bold: true, size: 18 })],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 60 / months.length, type: WidthType.PERCENTAGE }
                  })),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'አጠቃላይ', bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
                    width: { size: 5, type: WidthType.PERCENTAGE }
                  })
                ]
              }),
              ...attendanceData.map((member, index) => new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${index + 1}`, size: 16 })], alignment: AlignmentType.CENTER })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: member.fullName || 'አይታወቅም...', size: 16 })] })]
                  }),
                  ...months.map(month => {
                    const monthKey = `${month.month} ${month.year}`;
                    const count = member.monthlyAttendances[monthKey] || 0;
                    return new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: `${count}`, size: 16 })], alignment: AlignmentType.CENTER })]
                    });
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${member.total}`, size: 16, bold: true })], alignment: AlignmentType.CENTER })]
                  })
                ]
              }))
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mezmur-attendance-report-${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const generatePDF = async (data: { months: MonthSelection[]; data: MemberAttendanceData[] }) => {
    const { months, data: attendanceData } = data;

    // Load Noto Sans Ethiopic font
    const fontResponse = await fetch('/assets/fonts/NotoSansEthiopic-VariableFont_wdth,wght.ttf');
    if (!fontResponse.ok) {
      throw new Error('Failed to load font file');
    }
    const fontBuffer = await fontResponse.arrayBuffer();
    const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontBuffer)));
    
    const doc = new jsPDF();
    doc.addFileToVFS('NotoSansEthiopic.ttf', fontBase64);
    doc.addFont('NotoSansEthiopic.ttf', 'NotoSansEthiopic', 'normal');
    doc.setFont('NotoSansEthiopic');

    // Title
    doc.setFontSize(16);
    doc.text('የወርኃዊ አቴንዳንስ ሪፖርት', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

    // Prepare table data
    const headers = ['No.', 'Name', ...months.map(m => `${m.month} ${m.year}`), 'Total'];
    const rows = attendanceData.map((member, index) => [
      index + 1,
      member.fullName || 'Unknown',
      ...months.map(month => member.monthlyAttendances[`${month.month} ${month.year}`] || 0),
      member.total
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'NotoSansEthiopic'
      },
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        font: 'NotoSansEthiopic'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 50 }
      }
    });

    doc.save(`mezmur-attendance-report-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Month Selection */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
          ወራትን ምረጥ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              ወር
            </label>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none"
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
              placeholder={currentEthiopianDate.year.toString()}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none"
              min={2000}
              max={2100}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={addMonth}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all bg-[hsl(25_70%_45%)] text-white hover:bg-[hsl(25_70%_40%)]"
            >
              <Plus size={16} />
              ወር ጨምር
            </button>
          </div>
        </div>

        {selectedMonths.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            {selectedMonths.map((month, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]"
              >
                {month.month} {month.year}
                <button
                  type="button"
                  onClick={() => removeMonth(index)}
                  className="opacity-50 hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={generateReport}
            disabled={selectedMonths.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all bg-[hsl(25_70%_45%)] text-white hover:bg-[hsl(25_70%_40%)] disabled:opacity-50"
          >
            ሪፖርት አውጣ
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              የሪፖርት ውጤቶች
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => downloadReport('docx')}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                DOCX
              </button>
              <button
                onClick={() => downloadReport('pdf')}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left p-3 font-semibold">ተ.ቁ.</th>
                  <th className="text-left p-3 font-semibold">ስም</th>
                  {reportData.months.map(month => (
                    <th key={`${month.month}-${month.year}`} className="text-center p-3 font-semibold">
                      {month.month} {month.year}
                    </th>
                  ))}
                  <th className="text-center p-3 font-semibold">አጠቃላይ</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((member, index) => (
                  <tr key={member.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)]">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{member.fullName || 'Unknown'}</td>
                    {reportData.months.map(month => {
                      const monthKey = `${month.month} ${month.year}`;
                      const count = member.monthlyAttendances[monthKey] || 0;
                      return (
                        <td key={monthKey} className="text-center p-3">
                          {count}
                        </td>
                      );
                    })}
                    <td className="text-center p-3 font-bold">{member.total}</td>
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
