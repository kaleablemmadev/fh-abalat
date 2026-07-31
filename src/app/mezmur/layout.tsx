'use client';

import React from 'react';
import AppLayout, { NavSection } from '@/src/components/layout/AppLayout';
import { Home, Music, ListMusic, Users, Calendar, Shield, CheckSquare, Mic2 } from 'lucide-react';

const mezmurNavItems: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/mezmur', icon: Home },
    ]
  },
  {
    label: 'Library',
    items: [
      { name: 'Music Library', href: '/mezmur/music', icon: Music },
      { name: 'Categories', href: '/mezmur/music-categories', icon: ListMusic },
    ]
  },
  {
    label: 'Personnel',
    items: [
      { name: 'Members', href: '/mezmur/members', icon: Users },
      { name: 'Attendance', href: '/mezmur/attendance', icon: CheckSquare },
      { name: 'Eligibility', href: '/mezmur/eligibility', icon: Shield },
    ]
  },
  {
    label: 'Planning',
    items: [
      { name: 'Schedule', href: '/mezmur/schedule', icon: Calendar },
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
