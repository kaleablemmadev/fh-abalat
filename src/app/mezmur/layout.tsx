'use client';

import React from 'react';
import AppLayout, { NavSection } from '@/src/components/layout/AppLayout';
import { Home, Music, ListMusic, Users, Calendar, Shield, CheckSquare, Mic2, Clock, FileText, Settings } from 'lucide-react';

const mezmurNavItems: NavSection[] = [
  {
    items: [
      { name: 'ዋና ገጽ', href: '/mezmur', icon: Home },
    ]
  },
  {
    label: 'መዝሙራት',
    items: [
      { name: 'የመዝሙር መዝገብ', href: '/mezmur/music', icon: Music },
      { name: 'የመዝሙር ምድብ', href: '/mezmur/music-categories', icon: ListMusic },
    ]
  },
  {
    label: 'የአባላት መዝገብ',
    items: [
      { name: 'አባላት', href: '/mezmur/members', icon: Users },
      { name: 'አቴንዳንስ', href: '/mezmur/attendance', icon: CheckSquare },
      { name: 'ፈቃዶች', href: '/mezmur/permissions', icon: Clock },
      { name: 'የአገልግሎት መስፈርት', href: '/mezmur/eligibility', icon: Shield },
    ]
  },
  {
    label: 'ጊዜያዊ',
    items: [
      { name: 'መርሐ ግብር', href: '/mezmur/schedule', icon: Calendar },
      { name: 'የወር መዝሙራት', href: '/mezmur/monthly-plan', icon: ListMusic },
    ]
  },
  {
    label: 'ሪፖርቶች',
    items: [
      { name: 'መስፈርት ማሟላት ሪፖርት', href: '/mezmur/reports/eligibility', icon: Shield },
      { name: 'የአቴንዳንስ ሪፖርት', href: '/mezmur/reports/monthly-attendance', icon: FileText },
    ]
  },
  {
    label: 'አስተዳደር',
    items: [
      { name: 'Settings', href: '/mezmur/settings', icon: Settings },
    ]
  }
];

export default function MezmurLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-mezmur">
      <AppLayout navItems={mezmurNavItems} modeLabel="Mezmur">
        {children}
      </AppLayout>
    </div>
  );
}
