"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Save, Calendar, Search, Plus, X, Download, FileText, File } from "lucide-react";
import { useRouter } from "next/navigation";
import { ethMonthNames } from "@/src/lib/ethiopiancal";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { jsPDF } from "jspdf";

interface MusicFile {
  id: string;
  title: string;
  fileUrl: string | null;
  lyrics: string;
  language: "GEEZ" | "AMHARIC";
  interpretation: string | null;
}

interface MonthlyPlanClientProps {
  musicFiles: MusicFile[];
  currentEthiopianDate: { year: number; month: string; day: number };
}

const DAYS = [1, 12, 21, 23, 24];

export default function MonthlyPlanClient({ musicFiles, currentEthiopianDate }: MonthlyPlanClientProps) {
  // Infer month number from month name
  let initialMonthNumber = 1;
  for (const [key, value] of Object.entries(ethMonthNames)) {
    if (value === currentEthiopianDate.month) {
      initialMonthNumber = parseInt(key);
      break;
    }
  }

  const [year, setYear] = useState(currentEthiopianDate.year);
  const [month, setMonth] = useState(initialMonthNumber);
  
  // State to hold selected music IDs for each day
  const [dayPlans, setDayPlans] = useState<Record<number, string[]>>({
    1: [], 12: [], 21: [], 23: [], 24: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  
  // Modal for adding music
  const [isSelectingForDay, setIsSelectingForDay] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Close download menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

  const fetchPlan = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/mezmur/monthly-plan?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        const newPlans: Record<number, string[]> = { 1: [], 12: [], 21: [], 23: [], 24: [] };
        
        for (const schedule of data) {
          if (DAYS.includes(schedule.day)) {
            newPlans[schedule.day] = schedule.musicFiles.map((m: any) => m.id);
          }
        }
        setDayPlans(newPlans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const planArray = Object.entries(dayPlans).map(([dayStr, musicFileIds]) => ({
        day: parseInt(dayStr),
        musicFileIds
      }));

      const res = await fetch("/api/mezmur/monthly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, dayPlans: planArray }),
      });
      if (res.ok) {
        alert("Schedule saved successfully!");
      } else {
        alert("Failed to save schedule.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeMusicFromDay = (day: number, musicId: string) => {
    setDayPlans(prev => ({
      ...prev,
      [day]: prev[day].filter(id => id !== musicId)
    }));
  };

  const addMusicToDay = (day: number, musicId: string) => {
    setDayPlans(prev => ({
      ...prev,
      [day]: [...prev[day], musicId]
    }));
    setIsSelectingForDay(null);
    setSearchTerm("");
  };

  const filteredMusic = musicFiles.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // Helper function to parse lyrics
  const parseLyrics = (raw: string): { text: string }[] => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as { text: string }[];
    } catch {}
    return [{ text: raw }];
  };

  // Generate DOCX
  const generateDOCX = async () => {
    setIsDownloading(true);
    try {
      const monthName = ethMonthNames[month as keyof typeof ethMonthNames];
      
      const children: any[] = [];
      
      // Title
      children.push(
        new Paragraph({
          text: `Monthly Mezmur Schedule - ${monthName} ${year}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      // Process each day
      for (const day of DAYS) {
        const dayMusicIds = dayPlans[day];
        if (dayMusicIds.length === 0) continue;

        const dayFiles = musicFiles.filter(m => dayMusicIds.includes(m.id));
        
        // Day header
        children.push(
          new Paragraph({
            children: [new TextRun({
              text: `${monthName} ${day}`,
              bold: true,
              size: 28
            })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          })
        );

        // Display each song with lyrics as plain text
        for (const file of dayFiles) {
          // Song title
          children.push(
            new Paragraph({
              children: [new TextRun({
                text: file.title,
                bold: true,
                size: 24
              })],
              spacing: { before: 300, after: 150 }
            })
          );

          // Language indicator
          children.push(
            new Paragraph({
              children: [new TextRun({
                text: file.language === "GEEZ" ? "ግዕዝ" : "Amharic",
                italics: true,
                size: 20,
                color: "888888"
              })],
              spacing: { after: 200 }
            })
          );

          // Lyrics as plain text with original formatting
          const zemachs = parseLyrics(file.lyrics);
          for (const zemach of zemachs) {
            children.push(
              new Paragraph({
                children: [new TextRun({
                  text: zemach.text,
                  size: 22
                })],
                spacing: { after: 120 }
              })
            );
          }

          // Add spacing between songs
          children.push(
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 400 }
            })
          );
        }
      }

      const doc = new Document({
        sections: [{
          children,
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch in twips
                bottom: 720,
                left: 720,
                right: 720
              }
            }
          }
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mezmur-schedule-${monthName}-${year}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Failed to generate DOCX file');
    } finally {
      setIsDownloading(false);
      setShowDownloadMenu(false);
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    setIsDownloading(true);
    try {
      const monthName = ethMonthNames[month as keyof typeof ethMonthNames];
      const doc = new jsPDF();
      
      // Load and add Noto Sans Ethiopic font
      const fontResponse = await fetch('/assets/fonts/NotoSansEthiopic-VariableFont_wdth,wght.ttf');
      if (!fontResponse.ok) {
        throw new Error('Failed to load font file');
      }
      const fontBuffer = await fontResponse.arrayBuffer();
      const fontBase64 = btoa(String.fromCharCode(...new Uint8Array(fontBuffer)));
      
      doc.addFileToVFS('NotoSansEthiopic.ttf', fontBase64);
      doc.addFont('NotoSansEthiopic.ttf', 'NotoSansEthiopic', 'normal');
      doc.setFont('NotoSansEthiopic');
      
      // Title
      doc.setFontSize(18);
      doc.text(`Monthly Mezmur Schedule - ${monthName} ${year}`, 105, 20, { align: 'center' });
      
      let yPos = 40;

      for (const day of DAYS) {
        const dayMusicIds = dayPlans[day];
        if (dayMusicIds.length === 0) continue;

        const dayFiles = musicFiles.filter(m => dayMusicIds.includes(m.id));
        
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Day header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${monthName} ${day}`, 20, yPos);
        yPos += 10;

        for (const file of dayFiles) {
          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          const zemachs = parseLyrics(file.lyrics);
          
          // Title
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(file.title, 20, yPos);
          yPos += 7;

          // Two-column layout for zemachs
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          const leftColumn: string[] = [];
          const rightColumn: string[] = [];
          
          for (let i = 0; i < zemachs.length; i += 2) {
            leftColumn.push(zemachs[i]?.text || "");
            rightColumn.push(zemachs[i + 1]?.text || "");
          }

          // Print left column
          let leftYPos = yPos;
          for (const text of leftColumn) {
            if (leftYPos > 280) {
              doc.addPage();
              leftYPos = 20;
            }
            doc.text(text, 20, leftYPos);
            leftYPos += 5;
          }

          // Print right column
          let rightYPos = yPos;
          for (const text of rightColumn) {
            if (rightYPos > 280) {
              doc.addPage();
              rightYPos = 20;
            }
            doc.text(text, 105, rightYPos);
            rightYPos += 5;
          }

          yPos = Math.max(leftYPos, rightYPos) + 10;
        }

        yPos += 10;
      }

      doc.save(`mezmur-schedule-${monthName}-${year}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF file. Note: PDF may not render Ethiopian characters perfectly. Use DOCX for better character support.');
    } finally {
      setIsDownloading(false);
      setShowDownloadMenu(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="opacity-50" size={18} />
          <span className="font-bold">Select Period:</span>
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg focus:outline-none"
        >
          {Object.entries(ethMonthNames).map(([num, name]) => (
            <option key={num} value={num}>{name}</option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="h-10 px-3 w-24 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg focus:outline-none"
        />
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] rounded-lg font-bold disabled:opacity-50 transition-colors border border-[hsl(var(--border))]"
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download
            </button>
            
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg overflow-hidden z-50 min-w-[150px]">
                <button
                  onClick={generateDOCX}
                  disabled={isDownloading}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
                >
                  <FileText size={14} />
                  Download as DOCX
                </button>
                <button
                  onClick={generatePDF}
                  disabled={isDownloading}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
                >
                  <File size={14} />
                  Download as PDF
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[hsl(25_70%_45%)] text-white hover:bg-[hsl(25_70%_40%)] rounded-lg font-bold disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin opacity-50" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAYS.map(day => (
            <div key={day} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[hsl(var(--border))]">
                <h3 className="font-bold text-lg">Day {day}</h3>
                <button
                  onClick={() => setIsSelectingForDay(day)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {dayPlans[day].length === 0 ? (
                  <p className="text-sm opacity-50 italic text-center py-4">No Mezmurs assigned</p>
                ) : (
                  dayPlans[day].map(musicId => {
                    const file = musicFiles.find(m => m.id === musicId);
                    if (!file) return null;
                    return (
                      <div key={musicId} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                        <span className="text-sm font-medium truncate pr-2">{file.title}</span>
                        <button
                          onClick={() => removeMusicFromDay(day, musicId)}
                          className="text-red-500 opacity-50 hover:opacity-100 flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSelectingForDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[hsl(var(--background))] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted))]">
              <h3 className="font-bold text-lg">Select Mezmur for Day {isSelectingForDay}</h3>
              <button
                onClick={() => { setIsSelectingForDay(null); setSearchTerm(""); }}
                className="opacity-50 hover:opacity-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-[hsl(var(--border))]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                <input
                  type="text"
                  placeholder="Search Mezmurs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] focus:outline-none"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {filteredMusic.length === 0 ? (
                <p className="p-4 text-center opacity-50">No mezmurs found</p>
              ) : (
                <div className="space-y-1">
                  {filteredMusic.map(m => {
                    const isAlreadyAdded = dayPlans[isSelectingForDay].includes(m.id);
                    return (
                      <button
                        key={m.id}
                        disabled={isAlreadyAdded}
                        onClick={() => addMusicToDay(isSelectingForDay, m.id)}
                        className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors
                          ${isAlreadyAdded ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800' : 'hover:bg-[hsl(var(--muted))]'}
                        `}
                      >
                        <span className="font-medium text-sm">{m.title}</span>
                        {isAlreadyAdded && <span className="text-xs uppercase tracking-wider">Added</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
