"use client";

import { useState } from "react";
import {
  FileText, Download, GraduationCap, Users,
  CheckSquare, Shield, Clock, Loader2, Search, X
} from "lucide-react";

interface ReportCenterProps {
  academicYears: any[];
  students: any[];
  events: any[];
}

export default function ReportCenter({ academicYears, students, events }: ReportCenterProps) {
  const [selectedYear, setSelectedYear] = useState(academicYears.find(y => y.isActive)?.id || academicYears[0]?.id || "");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [showAbsentDates, setShowAbsentDates] = useState(false);

  const download = async (type: string, options: any = {}) => {
    setLoading(type);
    try {
      const params = new URLSearchParams({
        type,
        academicYearId: selectedYear,
        ...options
      });

      const url = `/api/course/reports?${params.toString()}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const Card = ({ title, icon: Icon, children, type, onDownload, disabled }: any) => (
    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
          <Icon size={20} />
        </div>
        <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
      </div>

      <div className="flex-1 space-y-4">
        {children}
      </div>

      <div className="pt-6 mt-6 border-t border-[hsl(var(--border))]">
        <button
          onClick={onDownload}
          disabled={!!loading || disabled}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {loading === type ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          ያውርዱ (Download PDF)
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">የሪፖርት ማዕከል (Reports Center)</h1>
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">
            Generate and export academic documents
          </p>
        </div>

        <div className="flex flex-col gap-1">
           <label className="text-[10px] font-black uppercase opacity-40 ml-1">Academic Year</label>
           <select
            className="h-11 px-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
           >
             {academicYears.map(y => (
               <option key={y.id} value={y.id}>{y.year} {y.isActive ? "(Active)" : ""}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Marks Section */}
        <Card
          title="የኮርስ ውጤቶች (Course Marks)"
          icon={GraduationCap}
          type="marks-by-course"
          onDownload={() => download("marks-by-course")}
        >
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            Download a comprehensive report grouped by course. Includes individual scores, grades, and global rankings.
          </p>
          <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
             <p className="text-[10px] font-bold text-blue-600">INCLUDES:</p>
             <p className="text-[10px] opacity-70 mt-1">• Tables per course • Rankings • Totals</p>
          </div>
        </Card>

        <Card
          title="የተማሪ ግሬድ ሉህ (Grade Sheets)"
          icon={FileText}
          type="marks-by-student"
          onDownload={() => download("marks-by-student", {
            studentIds: selectedStudents.length > 0 ? selectedStudents.join(",") : undefined
          })}
        >
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
            Generate individual grade sheets for all or selected students.
          </p>

          <div className="space-y-3">
             <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 opacity-30" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full h-9 pl-9 pr-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs outline-none"
                  value={studentSearch}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>

             <div className="max-h-32 overflow-y-auto border border-[hsl(var(--border))] rounded-lg p-2 space-y-1 bg-[hsl(var(--background))]">
                {filteredStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-[hsl(var(--accent))] rounded cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-zinc-300"
                      checked={selectedStudents.includes(s.id)}
                      onChange={e => {
                        if (e.target.checked) setSelectedStudents([...selectedStudents, s.id]);
                        else setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                      }}
                    />
                    <span className="text-[11px] font-medium truncate">{s.fullName}</span>
                  </label>
                ))}
             </div>

             {selectedStudents.length > 0 && (
               <div className="flex items-center justify-between">
                 <p className="text-[10px] font-bold text-blue-600">{selectedStudents.length} selected</p>
                 <button onClick={() => setSelectedStudents([])} className="text-[10px] font-bold opacity-40 hover:opacity-100 flex items-center gap-1">
                   <X size={10} /> Clear
                 </button>
               </div>
             )}
          </div>
        </Card>

        {/* Attendance Section */}
        <Card
          title="መፈተኛ መስፈርት (Eligibility)"
          icon={Shield}
          type="attendance-eligibility"
          disabled={!selectedEvent}
          onDownload={() => download("attendance-eligibility", { eventId: selectedEvent })}
        >
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Download list of students eligible for the selected exam session.
          </p>
          <div className="space-y-1">
             <label className="text-[9px] font-black uppercase opacity-40">Select Exam Event</label>
             <select
               className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs font-bold"
               value={selectedEvent}
               onChange={e => setSelectedEvent(e.target.value)}
             >
               <option value="">Select event...</option>
               {events.map(e => (
                 <option key={e.id} value={e.id}>{e.title} ({new Date(e.date).toLocaleDateString()})</option>
               ))}
             </select>
          </div>
        </Card>

        <Card
          title="ተማሪ አቴንዳንስ (Student Attendance)"
          icon={CheckSquare}
          type="attendance-student"
          onDownload={() => download("attendance-student", { showAbsentDates })}
        >
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Generate attendance summaries for all students in the current year.
          </p>
          <label className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 cursor-pointer">
             <input
              type="checkbox"
              className="w-4 h-4 rounded border-zinc-300"
              checked={showAbsentDates}
              onChange={e => setShowAbsentDates(e.target.checked)}
             />
             <span className="text-xs font-bold opacity-70 uppercase tracking-tighter">Show Specific Absent Dates</span>
          </label>
        </Card>

        <Card
          title="መምህራን የሥራ ሪፖርት (Instructors)"
          icon={Clock}
          type="attendance-instructor"
          onDownload={() => download("attendance-instructor")}
        >
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
            Record of teaching hours, substitution history, and comparison against required course hours.
          </p>
          <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/10">
             <p className="text-[10px] font-bold text-purple-600 uppercase">Highlights:</p>
             <p className="text-[10px] opacity-70 mt-1">• Hours Taught vs Required • Substitution logs</p>
          </div>
        </Card>

      </div>
    </div>
  );
}
