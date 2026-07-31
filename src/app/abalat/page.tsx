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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          የአባላት ጉዳይ ገጽ
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          የአባላት አቴንዳንስና የአባላት መከታተያ ድኅረ ገጽ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-lg p-6 transition-all duration-150"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mt-2" style={{ color: 'hsl(var(--foreground))' }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="p-2 rounded transition-colors duration-150"
                style={{
                  background: 'hsl(var(--primary) / 0.1)',
                  color: 'hsl(var(--primary))',
                }}
              >
                <stat.icon size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>
              ዝርዝር ተመልከቱ <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>

      <div
        className="rounded-lg p-6"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/abalat/members/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <Users size={16} />
            ዐዲስ አባል
          </Link>
          <Link
            href="/abalat/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <Calendar size={16} />
            ዐዲስ በዓል
          </Link>
          <Link
            href="/abalat/attendance/chore"
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <CheckSquare size={16} />
            አቴንዳንስ መዝግብ
          </Link>
        </div>
      </div>
    </div>
  );
}
