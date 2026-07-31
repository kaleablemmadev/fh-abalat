// /app/member/layout.tsx
'use client';

import React from 'react';
import AppLayout, { NavSection } from '@/src/components/layout/AppLayout';
import { Home, ClipboardList, Bell, User } from 'lucide-react';

const memberNavItems: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/member', icon: Home },
      { name: 'Attendance History', href: '/member/attendance', icon: ClipboardList },
      { name: 'Notifications', href: '/member/notifications', icon: Bell },
    ]
  },
  {
    label: 'Account',
    items: [
      { name: 'My Profile', href: '/member/profile', icon: User },
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
