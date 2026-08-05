'use client';

import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Trophy,
  Download,
  Filter,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { courseClassTypeDisplayNames } from '../constants/courseEnum';

interface PerformanceStudent {
  studentId: string;
  fullName: string;
  privateId: string;
  courseGrades: {
    courseId: string;
    courseName: string;
    score: number;
    letterGrade: string;
    passStatus: string;
    isGradingComplete: boolean;
  }[];
  averageScore: number;
  totalScore: number;
  overallPassStatus: string;
  rank: number;
}

interface PerformanceData {
  courses: { id: string; name: string }[];
  students: PerformanceStudent[];
}

export default function PerformanceDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch('/api/course/course-classes');
        if (res.ok) {
          const classesData = await res.json();
          setClasses(classesData);
          if (classesData.length > 0) {
            setSelectedClassId(classesData[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      }
    }
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchPerformance(selectedClassId);
    }
  }, [selectedClassId]);

  async function fetchPerformance(classId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/course/performance?courseClassId=${classId}`);
      if (res.ok) {
        const perfData = await res.json();
        setData(perfData);
      } else {
        throw new Error("Failed to load performance data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setLoading(false);
    }
  }

  const downloadPDF = () => {
    if (!selectedClassId) return;
    window.location.href = `/api/course/performance/download?courseClassId=${selectedClassId}`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Academic Performance & Rankings
        </h1>
        <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
          Comprehensive view of student grades, averages, and rankings per class.
        </p>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[hsl(var(--border))] pb-px overflow-x-auto">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              selectedClassId === cls.id
                ? 'border-blue-500 text-blue-500 bg-blue-500/5'
                : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {courseClassTypeDisplayNames[cls.name as keyof typeof courseClassTypeDisplayNames] || cls.name} ({cls.year})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Calculating rankings and averages...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-red-500/5 border border-red-500/20 rounded-2xl">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={32} />
          <p className="text-red-500 font-bold">{error}</p>
          <button onClick={() => fetchPerformance(selectedClassId)} className="mt-4 text-sm text-blue-500 hover:underline">Retry</button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider">Class Average</h3>
              </div>
              <p className="text-3xl font-black">
                {(data.students.reduce((sum, s) => sum + s.averageScore, 0) / (data.students.length || 1)).toFixed(1)}%
              </p>
            </div>

            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Trophy size={20} />
                </div>
                <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider">Top Performer</h3>
              </div>
              <p className="text-xl font-bold truncate">{data.students[0]?.fullName || "N/A"}</p>
              <p className="text-xs opacity-50 font-bold mt-1">{data.students[0]?.averageScore.toFixed(1)}% Score</p>
            </div>

            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider mb-2">Total Students</h3>
                <p className="text-3xl font-black">{data.students.length}</p>
              </div>
              <button
                onClick={downloadPDF}
                className="p-3 bg-[hsl(var(--muted))] rounded-xl hover:bg-[hsl(var(--accent))] transition-colors border border-[hsl(var(--border))]"
                title="Download PDF Report"
              >
                <Download size={20} />
              </button>
            </div>
          </div>

          {/* Performance Table */}
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Rank</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Student Name</th>
                    {data.courses.map(course => (
                      <th key={course.id} className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60 text-center">
                        {course.name}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60 text-center bg-zinc-500/5">Total</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60 text-center bg-blue-500/5 text-blue-500">Average</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60 text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {data.students.map((student) => (
                    <tr key={student.studentId} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          student.rank === 1 ? 'bg-yellow-500/20 text-yellow-600' :
                          student.rank === 2 ? 'bg-slate-300 text-slate-600' :
                          student.rank === 3 ? 'bg-orange-400/20 text-orange-600' :
                          'bg-[hsl(var(--muted))] opacity-60'
                        }`}>
                          {student.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm">{student.fullName}</div>
                        <div className="text-[10px] opacity-40 font-mono mt-0.5">{student.privateId}</div>
                      </td>
                      {student.courseGrades.map((grade, idx) => (
                        <td key={idx} className={`px-6 py-4 text-center ${!grade.isGradingComplete ? 'opacity-40' : ''}`}>
                          <div className={`text-sm font-bold ${grade.score >= 50 ? 'text-[hsl(var(--foreground))]' : 'text-red-500'}`}>
                            {grade.score.toFixed(0)}
                            {!grade.isGradingComplete && <span className="ml-0.5 text-[8px]">*</span>}
                          </div>
                          <div className="text-[10px] opacity-40 font-bold">{grade.letterGrade}</div>
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center bg-zinc-500/5 text-xs font-medium opacity-60">
                        {student.totalScore.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-500/5 font-black text-blue-500">
                        {student.averageScore.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${
                          student.overallPassStatus === 'PASSED'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {student.overallPassStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                            href={`/course/members/${student.studentId}`}
                            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] inline-flex items-center gap-1.5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all text-blue-500"
                        >
                            Details <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-20 text-center opacity-30 italic text-sm">Select a class to view performance data.</div>
      )}
    </div>
  );
}
