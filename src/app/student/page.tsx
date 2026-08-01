'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CheckSquare, Award, Clock, Calendar, Users, GraduationCap, ChevronRight } from 'lucide-react';

interface StudentData {
  fullName: string;
  enrollments: any[];
  marks: any[];
  attendances: any[];
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      fetchStudentData(session.userId);
    }
  }, []);

  const fetchStudentData = async (studentId: string) => {
    try {
      const res = await fetch(`/api/student/stats?studentId=${studentId}`);
      if (res.ok) {
        const studentData = await res.json();
        setData(studentData);
      }
    } catch (err) {
      console.error('Failed to fetch student data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading your dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Could not load your records.</div>;

  const activeEnrollment = data.enrollments[0];
  const currentClass = activeEnrollment?.courseClass;
  const currentCourses = activeEnrollment?.courseClass?.courseYears || [];

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome & Class Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {data.fullName}</h1>
        {currentClass ? (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--primary))] font-bold uppercase tracking-widest">
            <GraduationCap size={16} />
            <span>Currently Enrolled in: {currentClass.name} ({currentClass.year})</span>
          </div>
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">You are not currently enrolled in any active class.</p>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <BookOpen size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Courses</span>
          </div>
          <p className="text-3xl font-bold">{currentCourses.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Active courses this term</p>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckSquare size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Recent Sessions</span>
          </div>
          <p className="text-3xl font-bold">{data.attendances.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Recorded attendance sessions</p>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Award size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">GPA / Grade</span>
          </div>
          <p className="text-3xl font-bold">--</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Cumulative performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen size={18} className="text-[hsl(var(--primary))]" />
            Current Courses
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {currentCourses.length === 0 ? (
              <div className="p-10 border border-dashed rounded-2xl text-center text-[hsl(var(--muted-foreground))] text-sm">
                No courses assigned to your class yet.
              </div>
            ) : (
              currentCourses.map((cy: any) => (
                <div key={cy.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:border-[hsl(var(--primary)/0.4)] transition-all flex items-center justify-between group">
                  <div className="space-y-1">
                    <h3 className="font-bold text-[hsl(var(--foreground))]">{cy.course.name}</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                      <Users size={12} />
                      Instructor: {cy.course.instructor.fullName}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-[hsl(var(--muted-foreground))] group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock size={18} className="text-[hsl(var(--primary))]" />
            Recent Attendance
          </h2>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden divide-y divide-[hsl(var(--border))] shadow-sm">
            {data.attendances.length === 0 ? (
              <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))] italic">
                No attendance records found.
              </div>
            ) : (
              data.attendances.map((att: any) => (
                <div key={att.id} className="p-4 flex items-center justify-between hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{att.event.title}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                      {new Date(att.event.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    att.attendanceType.value >= 1 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {att.attendanceType.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
