"use client";

import { useState } from "react";
import { Download, Loader2, FileText, File } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, HeadingLevel, AlignmentType, WidthType } from "docx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Event {
  id: string;
  title: string;
  ethiopianYear: number | null;
  ethiopianMonth: number | null;
  ethiopianDay: number | null;
  eligibilityRule: {
    id: string;
    name: string;
    criteria: {
      minAttendances: number;
      lookbackMonths: number;
    }[];
  } | null;
  attendances: {
    member: {
      id: string;
      fullName: string | null;
      privateId: string | null;
    };
    attendanceType: {
      value: number;
    };
    permission: {
      status: string;
    } | null;
  }[];
}

interface Member {
  id: string;
  fullName: string | null;
  privateId: string | null;
  memberType: string;
}

interface Permission {
  id: string;
  memberId: string;
  status: string;
  ethiopianStartDate: string | null;
  ethiopianEndDate: string | null;
}

interface MezmurEligibilityReportClientProps {
  events: Event[];
  members: Member[];
  permissions: Permission[];
}

export default function MezmurEligibilityReportClient({ events, members, permissions }: MezmurEligibilityReportClientProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Calculate eligibility for a specific event
  const calculateEligibility = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return [];

    return members.map(member => {
      const memberAttendances = event.attendances.filter(a => a.member.id === member.id);
      const attendanceScore = memberAttendances.reduce((sum, a) => {
        if (a.permission?.status === 'APPROVED') return sum + 0.5;
        return sum + a.attendanceType.value;
      }, 0);

      const permission = permissions.find(p => p.memberId === member.id && p.status === 'APPROVED');
      const hasPermission = !!permission;

      let isEligible = true;
      let eligibilityReason = "Eligible";

      if (event.eligibilityRule) {
        const rule = event.eligibilityRule;
        const minRequired = rule.criteria[0]?.minAttendances || 0;
        
        if (attendanceScore < minRequired && !hasPermission) {
          isEligible = false;
          eligibilityReason = `Insufficient attendance (${attendanceScore}/${minRequired})`;
        }
      }

      return {
        member,
        attendanceScore,
        hasPermission,
        isEligible,
        eligibilityReason
      };
    });
  };

  const generateDOCX = async () => {
    if (!selectedEventId) return;
    
    setIsGenerating(true);
    try {
      const event = events.find(e => e.id === selectedEventId);
      if (!event) throw new Error("Event not found");

      const eligibilityData = calculateEligibility(selectedEventId);
      const eligibleMembers = eligibilityData.filter(d => d.isEligible);
      const ineligibleMembers = eligibilityData.filter(d => !d.isEligible);

      // Split members into two columns
      const membersPerColumn = Math.ceil(eligibleMembers.length / 2);
      const column1 = eligibleMembers.slice(0, membersPerColumn);
      const column2 = eligibleMembers.slice(membersPerColumn);

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 500, bottom: 500, left: 500, right: 500 }
            }
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'የመዝሙር አገልግሎት ሪፖርት', size: 32, bold: true })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [new TextRun({ text: `በዓል: ${event.title}`, size: 24, bold: true })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 50 }
            }),
            new Paragraph({
              children: [new TextRun({ text: `ቀን: ${event.ethiopianMonth}/${event.ethiopianDay}/${event.ethiopianYear}`, size: 20 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `አጠቃላይ አባላት: ${members.length}`, size: 20, bold: true }),
                new TextRun({ text: ` | መስፈርት ያሟሉ: ${eligibleMembers.length}`, size: 20, bold: true, color: '2e7d32' })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 150 }
            }),
            new Paragraph({
              children: [new TextRun({ text: 'መስፈርት ያሟሉ አባላት:', size: 22, bold: true })],
              spacing: { after: 100 }
            }),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: column1.map(m => new Paragraph({
                        children: [new TextRun({ text: m.member.fullName || 'አይታወቅም...', size: 18 })]
                      })),
                      width: { size: 50, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: column2.map(m => new Paragraph({
                        children: [new TextRun({ text: m.member.fullName || 'አይታወቅም...', size: 18 })]
                      })),
                      width: { size: 50, type: WidthType.PERCENTAGE }
                    })
                  ]
                })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE }
            }),
            new Paragraph({
              children: [new TextRun({ text: 'መስፈርት የሌለች አባላት:', size: 22, bold: true })],
              spacing: { before: 200, after: 100 }
            }),
            ...ineligibleMembers.map(m => new Paragraph({
              children: [new TextRun({ 
                text: `${m.member.fullName || 'አይታወቅም...'} - ${m.eligibilityReason}`,
                size: 18,
                color: 'c62828'
              })]
            }))
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mezmur-eligibility-${event.title}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Failed to generate DOCX file');
    } finally {
      setIsGenerating(false);
      setShowDownloadMenu(false);
    }
  };

  const generatePDF = async () => {
    if (!selectedEventId) return;
    
    setIsGenerating(true);
    try {
      const event = events.find(e => e.id === selectedEventId);
      if (!event) throw new Error("Event not found");

      const eligibilityData = calculateEligibility(selectedEventId);
      const eligibleMembers = eligibilityData.filter(d => d.isEligible);
      const ineligibleMembers = eligibilityData.filter(d => !d.isEligible);

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
      doc.setFontSize(18);
      doc.text('የመዝሙር አገልግሎት ሪፖርት', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(`በዓል: ${event.title}`, 105, 30, { align: 'center' });
      doc.text(`ቀን: ${event.ethiopianMonth}/${event.ethiopianDay}/${event.ethiopianYear}`, 105, 38, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`አጠቃላይ አባላት: ${members.length} | መስፈርት ያሟሉ: ${eligibleMembers.length}`, 105, 48, { align: 'center' });

      // Eligible members table
      const eligibleData = eligibleMembers.map((m, i) => [i + 1, m.member.fullName || 'Unknown']);
      autoTable(doc, {
        startY: 55,
        head: [['ተ.ቁ.', 'ስም']],
        body: eligibleData,
        theme: 'grid',
        styles: { font: 'NotoSansEthiopic', fontSize: 10 },
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] }
      });

      // Ineligible members
      const ineligibleData = ineligibleMembers.map((m, i) => [
        i + 1,
        m.member.fullName || 'Unknown',
        m.eligibilityReason
      ]);
      
      const firstTableY = (doc as any).lastAutoTable?.finalY || 80;
      
      autoTable(doc, {
        startY: firstTableY + 20,
        head: [['ተ.ቁ.', 'ስም', 'ምክንያት']],
        body: ineligibleData,
        theme: 'grid',
        styles: { font: 'NotoSansEthiopic', fontSize: 10 },
        headStyles: { fillColor: [198, 40, 40], textColor: [255, 255, 255] }
      });

      doc.save(`mezmur-eligibility-${event.title}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF file');
    } finally {
      setIsGenerating(false);
      setShowDownloadMenu(false);
    }
  };

  const currentEligibility = selectedEventId ? calculateEligibility(selectedEventId) : [];

  return (
    <div className="space-y-6">
      {/* Event Selection */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
          Select Event
        </h2>
        
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <option value="">Select an event...</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.title} - {event.ethiopianMonth}/{event.ethiopianDay}/{event.ethiopianYear}
            </option>
          ))}
        </select>

        {selectedEventId && (
          <div className="mt-4 flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(25_70%_45%)] text-white rounded-lg font-bold disabled:opacity-50 transition-colors"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Download Report
              </button>
              
              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg overflow-hidden z-50 min-w-[150px]">
                  <button
                    onClick={generateDOCX}
                    disabled={isGenerating}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
                  >
                    <FileText size={14} />
                    Download as DOCX
                  </button>
                  <button
                    onClick={generatePDF}
                    disabled={isGenerating}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
                  >
                    <File size={14} />
                    Download as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Eligibility Results */}
      {selectedEventId && currentEligibility.length > 0 && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "hsl(var(--foreground))" }}>
            Eligibility Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[hsl(var(--muted))] rounded-lg p-4">
              <p className="text-sm opacity-60">Total Members</p>
              <p className="text-2xl font-bold">{currentEligibility.length}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-4">
              <p className="text-sm opacity-60">Eligible</p>
              <p className="text-2xl font-bold text-emerald-500">
                {currentEligibility.filter(d => d.isEligible).length}
              </p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4">
              <p className="text-sm opacity-60">Ineligible</p>
              <p className="text-2xl font-bold text-red-500">
                {currentEligibility.filter(d => !d.isEligible).length}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {currentEligibility.map((data, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  data.isEligible
                    ? 'bg-emerald-500/5 border border-emerald-500/20'
                    : 'bg-red-500/5 border border-red-500/20'
                }`}
              >
                <div>
                  <p className="font-medium" style={{ color: "hsl(var(--foreground))" }}>
                    {data.member.fullName || 'Unknown'}
                  </p>
                  <p className="text-xs opacity-60">
                    Attendance: {data.attendanceScore} | Permission: {data.hasPermission ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  data.isEligible
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {data.isEligible ? 'Eligible' : 'Ineligible'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
