// /app/member/layout.tsx
'use client';

import React from 'react';
import AppLayout, { NavSection } from '@/src/components/layout/AppLayout';
import { Home, ClipboardList, Bell, User, Calendar, Music, ListMusic } from 'lucide-react';

const memberNavItems: NavSection[] = [
  {
    items: [
      { name: 'ዋና ገጽ', href: '/member', icon: Home },
      { name: 'የአቴንዳንስ መዝገብ', href: '/member/attendance', icon: ClipboardList },
      { name: 'ማስታወቂያና መረጃዎች', href: '/member/notifications', icon: Bell },
    ]
  },
  {
    label: 'መዝሙር',
    items: [
      { name: 'የአገልግሎት መዝሙራት', href: '/member/mezmur-plan', icon: Calendar },
      { name: 'የመዝሙር መዝገብ', href: '/member/music', icon: Music },
      { name: 'የመዝሙር ምድቦች', href: '/member/music-categories', icon: ListMusic },
    ]
  },
  {
    label: 'አካውንት',
    items: [
      { name: 'የግል መረጃዎች', href: '/member/profile', icon: User },
    ]
  }
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-member">
      <AppLayout navItems={memberNavItems} modeLabel="Member">
        {children}
      </AppLayout>
      <style jsx global>{`
        .theme-member {
          --primary: 217 91% 60%;
          --primary-foreground: 222.2 47.4% 11.2%;
        }
      `}</style>
    </div>
  );
}
