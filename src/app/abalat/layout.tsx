'use client';

import React from 'react';
import AppLayout, { NavSection } from '@/src/components/layout/AppLayout';
import { Home, Users, Calendar, CheckSquare, Shield, FileText, BarChart3, ScrollText, Settings } from 'lucide-react';

const abalatNavItems: NavSection[] = [
  {
    items: [
      { name: 'ዋና ገጽ', href: '/abalat', icon: Home },
    ]
  },
  {
    label: 'መከታተያ',
    items: [
      { name: 'አባላት', href: '/abalat/members', icon: Users },
      { name: 'በዓላት', href: '/abalat/events', icon: Calendar },
    ]
  },
  {
    label: 'ምዝገባዎች',
    items: [
      { name: 'አቴንዳንስ', href: '/abalat/attendance/chore', icon: CheckSquare },
      { name: 'አገልግሎት መስፈርት', href: '/abalat/eligibility-rules', icon: Shield },
      { name: 'ፈቃዶች', href: '/abalat/permission-types', icon: FileText },
      { name: 'የአባላት ፍቃዶች', href: '/abalat/permissions', icon: ScrollText },
    ]
  },
  {
    label: 'ገለጻ',
    items: [
      { name: 'ሪፖርቶች', href: '/abalat/reports/monthly-attendance', icon: BarChart3 },
    ]
  },
  {
    label: 'አስተዳደር',
    items: [
      { name: 'ቅድሚያ አስተዳደር', href: '/abalat/settings', icon: Settings },
    ]
  }
];

export default function AbalatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-abalat">
      <AppLayout navItems={abalatNavItems} modeLabel="Abalat">
        {children}
      </AppLayout>
    </div>
  );
}
