"use client";

import { useState } from "react";
import {
  Download, Upload, Users, BookOpen, GraduationCap,
  CheckCircle2, AlertCircle, Loader2, FileSpreadsheet
} from "lucide-react";

type ImportType = "instructors" | "courses" | "marks";

export default function ImportCenter() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});

  const downloadTemplate = async (type: ImportType) => {
    window.location.href = `/api/course/excel/template/${type}`;
  };

  const handleFileUpload = async (type: ImportType, file: File) => {
    if (!file) return;

    setLoading(prev => ({ ...prev, [type]: true }));
    setResults(prev => ({ ...prev, [type]: null }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/course/excel/import/${type}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResults(prev => ({ ...prev, [type]: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, [type]: { error: "Upload failed" } }));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const Card = ({ type, title, icon: Icon, description }: any) => (
    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
          <Icon size={24} />
        </div>
        <button
          onClick={() => downloadTemplate(type)}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all"
        >
          <Download size={14} />
          Template
        </button>
      </div>

      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{description}</p>
      </div>

      <div className="pt-4 border-t border-[hsl(var(--border))] space-y-4">
        <label className="block w-full">
          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.98]">
            {loading[type] ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            Upload Excel
          </div>
          <input
            type="file"
            className="hidden"
            accept=".xlsx, .xls"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(type, e.target.files[0])}
            disabled={loading[type]}
          />
        </label>

        {results[type] && (
          <div className={`p-4 rounded-xl text-xs space-y-2 ${results[type].error ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
            {results[type].error ? (
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={14} />
                {results[type].error}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={14} />
                  Import Complete
                </div>
                <p>Successfully processed {results[type].success || 0} records.</p>
                {results[type].errors?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/50">
                    <p className="font-bold mb-1">Issues ({results[type].errors.length}):</p>
                    <ul className="list-disc pl-4 space-y-1 opacity-80 max-h-24 overflow-y-auto">
                      {results[type].errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-zinc-900 text-white rounded-2xl">
          <FileSpreadsheet size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Excel Data Center</h1>
          <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">
            Import & Manage Core Records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          type="instructors"
          title="Instructors"
          icon={Users}
          description="Import teacher profiles and contact information."
        />
        <Card
          type="courses"
          title="Courses"
          icon={BookOpen}
          description="Setup courses, topics, credits, and mark weights."
        />
        <Card
          type="marks"
          title="Student Marks"
          icon={GraduationCap}
          description="Upload grades for multiple courses via sheet tabs."
        />
      </div>

      <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-[2rem] space-y-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Important Instructions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-zinc-600 leading-relaxed">
          <div className="space-y-2">
            <p><span className="font-bold text-zinc-900">1. Templates:</span> Always use the provided templates to ensure the column headers match the system requirements.</p>
            <p><span className="font-bold text-zinc-900">2. Marks:</span> For the marks import, the name of each Excel sheet must match the <span className="italic">Course Name</span> exactly.</p>
          </div>
          <div className="space-y-2">
            <p><span className="font-bold text-zinc-900">3. Students:</span> Students are matched by their <span className="italic">Full Name</span>. Ensure names in Excel match the system records.</p>
            <p><span className="font-bold text-zinc-900">4. Consistency:</span> Ensure Departments and Instructors exist before importing courses that reference them.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
