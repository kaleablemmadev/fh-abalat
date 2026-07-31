'use client';

import { Users, Calendar, CheckSquare, Shield, FileText, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AbalatHomePage() {
  const [stats, setStats] = useState([
    { label: 'አባላት ብዛት', value: '0', icon: Users, href: '/abalat/members' },
    { label: 'የአገልግሎት በዓላት', value: '0', icon: Calendar, href: '/abalat/events' },
    { label: 'የተመዘገቡ አቴንዳንሶች', value: '0', icon: CheckSquare, href: '/abalat/attendance/chore' },
    { label: 'የአገልግሎት መስፈርት', value: '0', icon: Shield, href: '/abalat/eligibility-rules' },
    { label: 'ፈቃዶች', value: '0', icon: FileText, href: '/abalat/permission-types' },
    { label: 'የአባላት ሪፖርት', value: '0', icon: BarChart3, href: '/abalat/reports/monthly-attendance' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [membersRes, eventsRes, rulesRes, permissionsRes] = await Promise.all([
          fetch('/api/abalat/members'),
          fetch('/api/abalat/events'),
          fetch('/api/abalat/eligibility-rules'),
          fetch('/api/abalat/permission-types'),
        ]);

        const [members, events, rules, permissions] = await Promise.all([
          membersRes.json(),
          eventsRes.json(),
          rulesRes.json(),
          permissionsRes.json(),
        ]);

        setStats([
          { label: 'የአባላት ብዛት', value: members.length?.toString() || '0', icon: Users, href: '/abalat/members' },
          { label: 'በዓላት', value: events.length?.toString() || '0', icon: Calendar, href: '/abalat/events' },
          { label: 'የተመዘገቡ አቴንዳንሶች', value: '0', icon: CheckSquare, href: '/abalat/attendance/chore' },
          { label: 'የአገልግሎት መስፈርት', value: rules.length?.toString() || '0', icon: Shield, href: '/abalat/eligibility-rules' },
          { label: 'ፈቃዶች', value: permissions.length?.toString() || '0', icon: FileText, href: '/abalat/permission-types' },
          { label: 'የአባላት ሪፖርት', value: '0', icon: BarChart3, href: '/abalat/reports/monthly-attendance' },
        ]);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          የአባላት ጉዳይ ገጽ
        </h1>
        <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
          የአባላት አቴንዳንስና የአባላት መከታተያ ድኅረ ገጽ
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl p-6 transition-all duration-200 bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)] hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.05)] active:scale-[0.98]"
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
                className="p-3 rounded-xl transition-colors duration-150 bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-white"
              >
                <stat.icon size={22} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-6 text-xs font-bold text-[hsl(var(--primary))] opacity-80 group-hover:opacity-100 transition-opacity">
              ዝርዝር ተመልከቱ <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      <div
        className="rounded-xl p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
      >
        <h2 className="text-lg font-bold mb-4 text-[hsl(var(--foreground))]">
          Quick Actions
        </h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            href="/abalat/members/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] active:scale-95 shadow-md shadow-[hsl(var(--primary)/0.2)]"
          >
            <Users size={18} />
            ዐዲስ አባል
          </Link>
          <Link
            href="/abalat/events/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] active:scale-95 shadow-md shadow-[hsl(var(--primary)/0.2)]"
          >
            <Calendar size={18} />
            ዐዲስ በዓል
          </Link>
          <Link
            href="/abalat/attendance/chore"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-150 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] active:scale-95 shadow-md shadow-[hsl(var(--primary)/0.2)]"
          >
            <CheckSquare size={18} />
            አቴንዳንስ መዝግብ
          </Link>
        </div>
      </div>
    </div>
  );
}
