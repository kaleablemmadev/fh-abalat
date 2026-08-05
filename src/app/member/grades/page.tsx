'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  ChevronLeft,
  Trophy,
  Target,
  FileText,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function MemberGradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      setUser(session);
      fetchGrades(session.userId);
    }
  }, []);

  async function fetchGrades(userId: string) {
    try {
      const res = await fetch(`/api/member/stats?memberId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setGrades(data.grades);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const averageScore = useMemo(() => {
    const completed = grades.filter(g => g.isGradingComplete);
    if (completed.length === 0) return 0;
    return completed.reduce((sum, g) => sum + (g.computedScore || 0), 0) / completed.length;
  }, [grades]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/member" className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">የውጤት ዝርዝር</h1>
          <p className="text-sm text-slate-400">የሁሉም ኮርሶች ውጤትና ደረጃ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Target size={20} />
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">አጠቃላይ አማካይ</h3>
          </div>
          <p className="text-3xl font-black text-white">
            {averageScore.toFixed(1)}%
          </p>
          {grades.some(g => !g.isGradingComplete) && (
            <p className="text-[10px] text-slate-500 mt-2">* Includes only completed courses</p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Trophy size={20} />
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">የትምህርት ውጤት ማጠቃለያ</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ያለፉባቸው</p>
              <p className="text-xl font-bold text-emerald-500">{grades.filter(g => g.passStatus === 'PASSED').length}</p>
            </div>
            <div className="flex-1 border-l border-slate-800 pl-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ያልተሳኩ</p>
              <p className="text-xl font-bold text-red-500">{grades.filter(g => g.passStatus === 'FAILED').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-800/50 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">የኮርሶች ዝርዝር ውጤት</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {loading ? (
            <div className="p-12 text-center animate-pulse text-slate-500 italic">ውጤቶች በመጫን ላይ ናቸው...</div>
          ) : grades.length === 0 ? (
            <div className="p-12 text-center text-slate-600 italic">ምንም የተመዘገበ ውጤት የለም።</div>
          ) : (
            grades.map((grade, idx) => (
              <div key={idx} className="p-6 hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-800 rounded-xl text-slate-400">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{grade.courseYear.course.name}</h4>
                      <p className="text-xs text-slate-500">አካዳሚክ ዓመት: {grade.courseYear.year}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ውጤት</p>
                      <p className="text-xl font-black text-blue-500">{grade.computedScore?.toFixed(1)}%</p>
                    </div>
                    <div className="text-center min-w-[60px]">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ደረጃ (Grade)</p>
                      <p className="text-xl font-black text-white">{grade.letterGrade || "-"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ሁኔታ</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        grade.passStatus === 'PASSED'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {grade.passStatus === 'PASSED' ? 'ያለፈ' : 'ያላለፈ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Mid Exam</p>
                    <p className="text-sm font-bold text-slate-200">{grade.midExamScore || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Assignment</p>
                    <p className="text-sm font-bold text-slate-200">{grade.assignmentScore || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Final Exam</p>
                    <p className="text-sm font-bold text-slate-200">{grade.finalExamScore || 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Attendance</p>
                    <p className="text-sm font-bold text-slate-200">{(grade.computedScore - ((grade.midExamScore||0)*0.25 + (grade.assignmentScore||0)*0.15 + (grade.finalExamScore||0)*0.5)).toFixed(1)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
