'use client';

import React from 'react';
import AppLayout, { NavSection } from '@/src/components/layout/AppLayout';
import { Home, CheckSquare, GraduationCap, Shield, Users, BookOpen, Layers, CalendarDays, ClipboardList, ExternalLink, Clock, FileText } from 'lucide-react';

const courseNavItems: NavSection[] = [
  {
    items: [
      { name: 'ዛሬ', href: '/course/today', icon: Home },
      { name: 'የድሮ ገጽ', href: '/course', icon: Home },
    ]
  },
  {
    label: 'ትምህርትና ኮርስ',
    items: [
      { name: 'አቴንዳንስ', href: '/course/attendance', icon: CheckSquare },
      { name: 'የመምህራን አቴንዳንስ', href: '/course/instructor-attendance', icon: ClipboardList },
      { name: 'ውጤቶች', href: '/course/marks', icon: GraduationCap },
      { name: 'ሪፖርቶች', href: '/course/reports', icon: FileText },
      { name: 'መፈተኛ መስፈርት', href: '/course/eligibility/report', icon: Shield },
      { name: 'ፈቃዶች', href: '/course/permissions', icon: Clock },
    ]
  },
  {
    label: 'ተማሪ ክትትል',
    items: [
      { name: 'ተማሪዎች', href: '/course/members', icon: Users },
      { name: 'ምዝገባዎች', href: '/course/enrollments', icon: ClipboardList },
      { name: 'ኮርሶች', href: '/course/courses', icon: BookOpen },
    ]
  },
  {
    label: 'ዓመታዊ መርሐ ግብር',
    items: [
      { name: 'የኮርስ ዓመት', href: '/course/academic-years', icon: CalendarDays },
    ]
  },
  {
    label: 'የክፍል መዋቅር',
    items: [
      { name: 'መምህራን', href: '/course/instructors', icon: Users },
      { name: 'ክፍላተ ትምህርት', href: '/course/departments', icon: Layers },
      { name: 'መረጃ ማስገቢያ (Excel)', href: '/course/import-export', icon: FileText },
    ]
  },
  {
    label: 'ምዝገባ (External)',
    items: [
      { name: 'የበጋ ኮርስ ምዝገባ', href: 'https://firecourse.vercel.app/bega', icon: ExternalLink, external: true },
      { name: 'የክረምት ኮርስ ምዝገባ', href: 'https://firecourse.vercel.app/keremt', icon: ExternalLink, external: true },
    ]
  }
];

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-course">
      <AppLayout navItems={courseNavItems} modeLabel="Course">
        {children}
      </AppLayout>
    </div>
  );
}
