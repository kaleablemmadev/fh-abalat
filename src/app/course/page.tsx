'use client';

import { CheckSquare, GraduationCap, Shield, ArrowRight, BookOpen, Users, Layers, RefreshCcw, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CourseHomePage() {
  const [stats, setStats] = useState([
    { label: 'ያሉ አባላት', value: '0', icon: Users, href: '/course/members' },
    { label: 'የትምህርት ውጤቶች', value: 'Rankings', icon: GraduationCap, href: '/course/performance' },
    { label: 'ማስታወቂያዎችና ዜናዎች', value: 'Broadcast', icon: Shield, href: '/course/announcements' },
    { label: 'የዓመት ኮርሶች', value: '0', icon: BookOpen, href: '/course/courses' },
    { label: 'አጠቃላይ አቴንዳንስ', value: '0', icon: CheckSquare, href: '/course/attendance' },
    { label: 'እየተሰጡ ያሉ ትምህርቶች', value: '0', icon: Shield, href: '/course/enrollments' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/course/stats');
        if (res.ok) {
          const data = await res.json();
          setStats([
            { label: 'ያሉ አባላት', value: data.studentCount.toString(), icon: Users, href: '/course/members' },
            { label: 'የትምህርት ውጤቶች', value: 'Rankings', icon: GraduationCap, href: '/course/performance' },
            { label: 'ማስታወቂያዎችና ዜናዎች', value: 'Broadcast', icon: Shield, href: '/course/announcements' },
            { label: 'የዓመት ኮርሶች', value: data.courseCount.toString(), icon: BookOpen, href: '/course/courses' },
            { label: 'አጠቃላይ አቴንዳንስ', value: data.attendanceCount.toString(), icon: CheckSquare, href: '/course/attendance' },
            { label: 'እየተሰጡ ያሉ ትምህርቶች', value: data.enrollmentCount.toString(), icon: Shield, href: '/course/enrollments' },
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
          የኮርስ ዋና ገጽ
        </h1>
        <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
          የኮርስ ክፍል ትምህርቶችና ተማሪዎች መከታተያ
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
              ዝርዝር ተመልከት <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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
            አቴንዳንስ መዝግብ
          </Link>
          <Link
            href="/course/marks"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(217,70%,32%)] text-white hover:bg-[hsl(217,70%,36%)] active:scale-95 shadow-md shadow-[hsl(217,70%,32%)/0.2]"
          >
            <GraduationCap size={18} />
            የተማሪ ውጤት አስገባ
          </Link>
          <Link
            href="/course/transition"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-orange-600 text-white hover:bg-orange-500 active:scale-95 shadow-md shadow-orange-900/20"
          >
            <RefreshCcw size={18} />
            የዓመት መጨረሻ መተላለፍ
          </Link>
          <Link
            href="/course/settings/timeline"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-slate-700 text-white hover:bg-slate-600 active:scale-95 shadow-md shadow-slate-900/20"
          >
            <Calendar size={18} />
            የትምህርት ጊዜ መርሐ ግብር
          </Link>
          <Link
            href="/register"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] active:scale-95 border border-[hsl(var(--border))]"
          >
            <Users size={18} />
            የምዝገባ ድኅረ ገጽ
          </Link>
        </div>
      </div>
    </div>
  );
}
