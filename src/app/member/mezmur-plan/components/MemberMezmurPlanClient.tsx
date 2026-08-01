"use client";

import { useState, useRef, useEffect } from "react";
import { X as CloseIcon, Music, Tag, Download, FileText, File, Loader2, Play, Pause } from "lucide-react";
import { ethMonthNames } from "@/src/lib/ethiopiancal";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { jsPDF } from "jspdf";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

// --- Zemach helpers ---
interface Zemach { text: string; }

function parseLyrics(raw: string): Zemach[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Zemach[];
  } catch {}
  // Legacy plain text: treat as single zemach
  return [{ text: raw }];
}

interface MusicFile {
  id: string;
  title: string;
  fileUrl: string | null;
  lyrics: string;
  language: "GEEZ" | "AMHARIC";
  interpretation: string | null;
}

interface MemberMezmurPlanClientProps {
  schedules: any[];
  musicFiles: MusicFile[];
  currentMonth: number;
  currentYear: number;
}

const DAYS = [1, 12, 21, 23, 24];

export default function MemberMezmurPlanClient({ schedules, musicFiles, currentMonth, currentYear }: MemberMezmurPlanClientProps) {
  const [viewingLyrics, setViewingLyrics] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [playingFile, setPlayingFile] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handlePlay = (file: any) => {
    if (playingFile?.id === file.id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingFile(file);
      setIsPlaying(true);
    }
  };

  // Generate DOCX
  const generateDOCX = async () => {
    setIsDownloading(true);
    try {
      const monthName = ethMonthNames[currentMonth as keyof typeof ethMonthNames];
      
      const children: any[] = [];
      
      // Title
      children.push(
        new Paragraph({
          text: `Monthly Mezmur Schedule - ${monthName} ${currentYear}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      // Process each day
      for (const day of DAYS) {
        const daySchedule = schedules.find((s: any) => s.day === day);
        if (!daySchedule || daySchedule.musicFiles.length === 0) continue;

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
        for (const file of daySchedule.musicFiles) {
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
                top: 720,
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
      a.download = `mezmur-schedule-${monthName}-${currentYear}.docx`;
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
      const monthName = ethMonthNames[currentMonth as keyof typeof ethMonthNames];
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
      doc.text(`Monthly Mezmur Schedule - ${monthName} ${currentYear}`, 105, 20, { align: 'center' });
      
      let yPos = 40;

      for (const day of DAYS) {
        const daySchedule = schedules.find((s: any) => s.day === day);
        if (!daySchedule || daySchedule.musicFiles.length === 0) continue;

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

        for (const file of daySchedule.musicFiles) {
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

      doc.save(`mezmur-schedule-${monthName}-${currentYear}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF file. Note: PDF may not render Ethiopian characters perfectly. Use DOCX for better character support.');
    } finally {
      setIsDownloading(false);
      setShowDownloadMenu(false);
    }
  };

  // Group schedules by day
  const dayPlans = schedules.reduce((acc: any, schedule: any) => {
    acc[schedule.day] = schedule.musicFiles;
    return acc;
  }, {});

  return (
    <>
      <style jsx global>{`
        .rhap_container {
          background: hsl(var(--card)) !important;
          border-radius: 8px;
        }
        .rhap_main {
          background: hsl(var(--background)) !important;
        }
        .rhap_progress-bar {
          background: hsl(var(--muted)) !important;
        }
        .rhap_progress-filled {
          background: hsl(25 70% 45%) !important;
        }
        .rhap_progress-indicator {
          background: hsl(25 70% 45%) !important;
        }
        .rhap_controls button {
          color: hsl(var(--foreground)) !important;
        }
        .rhap_time {
          color: hsl(var(--muted-foreground)) !important;
        }
      `}</style>
      <div className="space-y-6">
      <div className="flex justify-end">
        <div className="relative" ref={downloadMenuRef}>
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] rounded-lg font-bold disabled:opacity-50 transition-colors border border-[hsl(var(--border))]"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download Schedule
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DAYS.map(day => {
          const files = dayPlans[day] || [];
          
          return (
            <div key={day} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-5 shadow-sm">
              <div className="mb-4 pb-2 border-b border-[hsl(var(--border))]">
                <h3 className="font-bold text-lg">Day {day}</h3>
              </div>

              <div className="space-y-2">
                {files.length === 0 ? (
                  <p className="text-sm opacity-50 italic text-center py-4">No Mezmurs assigned</p>
                ) : (
                  files.map((file: any) => (
                    <div key={file.id} className="space-y-2">
                      <button
                        onClick={() => setViewingLyrics(file)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-full bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] shrink-0">
                            <Music size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block truncate">{file.title}</span>
                            {file.categories && file.categories.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Tag size={10} className="opacity-40 shrink-0" />
                                <span className="text-[10px] opacity-50 truncate">
                                  {file.categories.map((c: any) => c.name).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {file.fileUrl && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePlay(file)}
                            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white transition-colors text-xs font-medium"
                          >
                            {playingFile?.id === file.id && isPlaying ? (
                              <Pause size={12} />
                            ) : (
                              <Play size={12} />
                            )}
                            {playingFile?.id === file.id && isPlaying ? 'Pause' : 'Play'}
                          </button>
                        </div>
                      )}
                      
                      {playingFile?.id === file.id && (
                        <div>
                          <AudioPlayer
                            src={file.fileUrl || ''}
                            autoPlay={isPlaying}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            style={{ width: '100%' }}
                            showJumpControls={false}
                            showSkipControls={false}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {viewingLyrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[hsl(var(--background))] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted))] rounded-t-2xl">
              <div>
                <h3 className="font-bold text-lg">{viewingLyrics.title}</h3>
                <p className="text-sm opacity-60">
                  {viewingLyrics.language === "GEEZ" ? "ግዕዝ" : "Amharic"}
                </p>
              </div>
              <button
                onClick={() => setViewingLyrics(null)}
                className="opacity-50 hover:opacity-100 p-2"
              >
                <CloseIcon size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 font-serif text-lg leading-relaxed whitespace-pre-wrap">
              {parseLyrics(viewingLyrics.lyrics).map((zemach, idx) => (
                <div 
                  key={idx} 
                  className={`mb-6 ${idx % 2 === 0 ? 'text-left' : 'text-right'}`}
                >
                  {zemach.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
