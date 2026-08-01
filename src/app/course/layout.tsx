'use client';

import React from 'react';
import AppLayout, { NavSection } from '@/src/components/layout/AppLayout';
import { Home, CheckSquare, GraduationCap, Shield, Users, BookOpen, Layers, CalendarDays, ClipboardList, ExternalLink, Clock } from 'lucide-react';

const courseNavItems: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/course', icon: Home },
    ]
  },
  {
    label: 'Academic',
    items: [
      { name: 'Attendance', href: '/course/attendance', icon: CheckSquare },
      { name: 'Marks', href: '/course/marks', icon: GraduationCap },
      { name: 'Eligibility', href: '/course/eligibility/report', icon: Shield },
      { name: 'Permissions', href: '/course/permissions', icon: Clock },
    ]
  },
  {
    label: 'Management',
    items: [
      { name: 'Students', href: '/course/members', icon: Users },
      { name: 'Enrollments', href: '/course/enrollments', icon: ClipboardList },
      { name: 'Courses', href: '/course/courses', icon: BookOpen },
    ]
  },
  {
    label: 'Setup',
    items: [
      { name: 'Term Setup', href: '/course/academic-years', icon: CalendarDays },
    ]
  },
  {
    label: 'Infrastructure',
    items: [
      { name: 'Instructors', href: '/course/instructors', icon: Users },
      { name: 'Departments', href: '/course/departments', icon: Layers },
    ]
  },
  {
    label: 'Registration (External)',
    items: [
      { name: 'Bega Form', href: 'https://firecourse.vercel.app/bega', icon: ExternalLink, external: true },
      { name: 'Keremt Form', href: 'https://firecourse.vercel.app/keremt', icon: ExternalLink, external: true },
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
