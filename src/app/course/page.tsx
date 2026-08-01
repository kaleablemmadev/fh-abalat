'use client';

import { CheckSquare, GraduationCap, Shield, ArrowRight, BookOpen, Users, Layers } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CourseHomePage() {
  const [stats, setStats] = useState([
    { label: 'Active Students', value: '0', icon: Users, href: '/course/members' },
    { label: 'Current Courses', value: '0', icon: BookOpen, href: '/course/courses' },
    { label: 'Total Attendance', value: '0', icon: CheckSquare, href: '/course/attendance' },
    { label: 'Active Enrollments', value: '0', icon: Shield, href: '/course/enrollments' },
    { label: 'Academic Staff', value: '0', icon: Users, href: '/course/instructors' },
    { label: 'Departments', value: '0', icon: Layers, href: '/course/departments' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/course/stats');
        if (res.ok) {
          const data = await res.json();
          setStats([
            { label: 'Active Students', value: data.studentCount.toString(), icon: Users, href: '/course/members' },
            { label: 'Current Courses', value: data.courseCount.toString(), icon: BookOpen, href: '/course/courses' },
            { label: 'Total Attendance', value: data.attendanceCount.toString(), icon: CheckSquare, href: '/course/attendance' },
            { label: 'Active Enrollments', value: data.enrollmentCount.toString(), icon: Shield, href: '/course/enrollments' },
            { label: 'Academic Staff', value: data.instructorCount.toString(), icon: Users, href: '/course/instructors' },
            { label: 'Departments', value: data.departmentCount.toString(), icon: Layers, href: '/course/departments' },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch course stats:', err);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Course Dashboard
        </h1>
        <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
          Academic management portal for students, courses, and performance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl p-6 transition-all duration-200 bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(217_70%_32%)/0.4] hover:shadow-lg hover:shadow-[hsl(217_70%_32%)/0.05] active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-3 text-[hsl(var(--foreground))]">
                  {stat.value}
                </p>
              </div>
              <div
                className="p-3 rounded-xl transition-colors duration-150 bg-[hsl(217_70%_32%)/0.1] text-[hsl(217_70%_32%)] group-hover:bg-[hsl(217_70%_32%)] group-hover:text-white"
              >
                <stat.icon size={22} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-6 text-xs font-bold text-[hsl(217_70%_32%)] opacity-80 group-hover:opacity-100 transition-opacity">
              View Details <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      <div
        className="rounded-xl p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
      >
        <h2 className="text-lg font-bold mb-4 text-[hsl(var(--foreground))]">
          Quick Management
        </h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            href="/course/attendance"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(217,70%,32%)] text-white hover:bg-[hsl(217,70%,36%)] active:scale-95 shadow-md shadow-[hsl(217,70%,32%)/0.2]"
          >
            <CheckSquare size={18} />
            Take Attendance
          </Link>
          <Link
            href="/course/marks"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(217,70%,32%)] text-white hover:bg-[hsl(217,70%,36%)] active:scale-95 shadow-md shadow-[hsl(217,70%,32%)/0.2]"
          >
            <GraduationCap size={18} />
            Enter Student Marks
          </Link>
          <Link
            href="/course/enrollments/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] active:scale-95 border border-[hsl(var(--border))]"
          >
            <Users size={18} />
            New Enrollment
          </Link>
        </div>
      </div>
    </div>
  );
}
