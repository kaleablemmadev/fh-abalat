'use client';

import { CheckSquare, GraduationCap, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CourseHomePage() {
  const stats = [
    { label: 'Attendance Records', value: '0', icon: CheckSquare, href: '/course/attendance' },
    { label: 'Student Marks', value: '0', icon: GraduationCap, href: '/course/marks' },
    { label: 'Eligibility Status', value: '0', icon: Shield, href: '/course/eligibility' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Course Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Student Attendance and Marks Management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              View details <ArrowRight size={14} />
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
            href="/course/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <CheckSquare size={16} />
            Take Attendance
          </Link>
          <Link
            href="/course/marks"
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <GraduationCap size={16} />
            Enter Marks
          </Link>
        </div>
      </div>
    </div>
  );
}
