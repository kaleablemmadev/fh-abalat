'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { courseClassTypeDisplayNames } from '../constants/courseEnum';

const CLASS_SEQUENCE = ['KEDAMAY', 'KALEAY', 'SALSAY', 'RABEAY', 'KEREMT'];

export default function TransitionPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchClasses() {
      const res = await fetch('/api/course/course-classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) setSelectedClassId(data[0].id);
      }
    }
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);

      // Auto-suggest target class (next in sequence)
      const currentClass = classes.find(c => c.id === selectedClassId);
      if (currentClass) {
        const currentIndex = CLASS_SEQUENCE.indexOf(currentClass.name);
        if (currentIndex !== -1 && currentIndex < CLASS_SEQUENCE.length - 1) {
          const nextClassName = CLASS_SEQUENCE[currentIndex + 1];
          const suggestion = classes.find(c => c.name === nextClassName && c.year !== currentClass.year);
          if (suggestion) setTargetClassId(suggestion.id);
        }
      }
    }
  }, [selectedClassId, classes]);

  async function fetchStudents(classId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/course/performance?courseClassId=${classId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handlePromote = async () => {
    const passedStudents = students.filter(s => s.overallPassStatus === 'PASSED').map(s => s.studentId);
    if (passedStudents.length === 0) return;
    if (!targetClassId) {
        alert("Please select a target class for promotion.");
        return;
    }

    if (!confirm(`Are you sure you want to promote ${passedStudents.length} students to the selected class?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/course/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: passedStudents,
          sourceClassId: selectedClassId,
          targetClassId: targetClassId
        })
      });
      if (res.ok) {
        alert("Students promoted successfully!");
        fetchStudents(selectedClassId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          End of Year Transition
        </h1>
        <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
          Review passed/failed students and promote them to the next academic level.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar: Class Selection */}
        <div className="w-full md:w-64 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-3 px-2">Current Class</p>
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-bold border ${
                selectedClassId === cls.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-blue-500/50'
              }`}
            >
              {courseClassTypeDisplayNames[cls.name as keyof typeof courseClassTypeDisplayNames] || cls.name}
              <div className={`text-[10px] mt-0.5 ${selectedClassId === cls.id ? 'text-blue-100' : 'opacity-40'}`}>
                {cls.year} Academic Year
              </div>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">Student Promotion List</h3>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 size={14} /> Passed: {students.filter(s => s.overallPassStatus === 'PASSED').length}
                </span>
                <span className="flex items-center gap-1.5 text-red-500">
                  <XCircle size={14} /> Failed: {students.filter(s => s.overallPassStatus === 'FAILED').length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-[hsl(var(--border))] max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-20 text-center animate-pulse opacity-40 italic">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="p-20 text-center opacity-30 italic">No students found for this class.</div>
              ) : (
                students.map((student) => (
                  <div key={student.studentId} className="p-4 flex items-center justify-between hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${student.overallPassStatus === 'PASSED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {student.overallPassStatus === 'PASSED' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{student.fullName}</p>
                        <p className="text-[10px] opacity-40 font-mono">{student.privateId} · Avg: {student.averageScore.toFixed(1)}%</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      student.overallPassStatus === 'PASSED'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {student.overallPassStatus}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-[hsl(var(--muted)/0.5)] border-t border-[hsl(var(--border))] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-md">
                <h4 className="text-sm font-bold mb-1">Promote All Passing Students</h4>
                <p className="text-xs opacity-50 leading-relaxed">
                  This will move all students marked as "PASSED" into a pending state for the next class in the new academic year.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="space-y-1.5 w-full sm:w-64">
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Target Class for Promotion</label>
                   <select
                      className="w-full h-11 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-4 text-sm font-bold focus:border-blue-500 transition-all outline-none"
                      value={targetClassId}
                      onChange={e => setTargetClassId(e.target.value)}
                   >
                      <option value="">Select target class...</option>
                      {classes.filter(c => c.id !== selectedClassId).map(c => (
                        <option key={c.id} value={c.id}>
                            {courseClassTypeDisplayNames[c.name as keyof typeof courseClassTypeDisplayNames] || c.name} ({c.year})
                        </option>
                      ))}
                   </select>
                </div>

                <button
                  onClick={handlePromote}
                  disabled={actionLoading || students.filter(s => s.overallPassStatus === 'PASSED').length === 0 || !targetClassId}
                  className="h-11 inline-flex items-center gap-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/20 transition-all disabled:opacity-30 disabled:shadow-none whitespace-nowrap"
                >
                  {actionLoading ? <RefreshCcw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  Promote {students.filter(s => s.overallPassStatus === 'PASSED').length} Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
