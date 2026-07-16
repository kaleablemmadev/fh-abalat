'use client'

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, CheckSquare, Shield, Settings, LogOut } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Home',        href: '/',                icon: Home },
  { name: 'Members',     href: '/members',         icon: Users },
  { name: 'Events',      href: '/events',          icon: Calendar },
  { name: 'Attendance',  href: '/attendance/chore', icon: CheckSquare },
  { name: 'Permissions', href: '/permissions',     icon: Shield },
  { name: 'Settings',    href: '/settings',        icon: Settings },
];

/** Derive initials from a display name */
function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  const pageTitle =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (pathname.startsWith(item.href) && item.href !== '/'),
    )?.name || 'Dashboard';

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href) && href !== '/');

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0"
        style={{
          background: 'hsl(var(--card))',
          borderRight: '1px solid hsl(var(--border))',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'hsl(160 60% 55%)' }}
          >
            Abalat
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? {
                        color: 'hsl(160 60% 60%)',
                        background: 'hsl(160 84% 39% / 0.08)',
                        borderLeft: '2px solid hsl(160 84% 39%)',
                        paddingLeft: '10px',
                      }
                    : {
                        color: 'hsl(var(--muted-foreground))',
                        borderLeft: '2px solid transparent',
                        paddingLeft: '10px',
                      }
                }
              >
                <item.icon
                  size={15}
                  style={{ color: active ? 'hsl(160 60% 60%)' : 'hsl(var(--muted-foreground))' }}
                  className="shrink-0 transition-colors duration-150 group-hover:text-zinc-200"
                />
                <span className="transition-colors duration-150 group-hover:text-zinc-200">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div
          className="px-3 py-3 flex items-center gap-2.5"
          style={{ borderTop: '1px solid hsl(var(--border))' }}
        >
          {/* Initials avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{
              background: 'hsl(160 40% 14%)',
              color: 'hsl(160 60% 55%)',
              border: '1px solid hsl(160 35% 22%)',
            }}
          >
            {initials('Admin')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-none truncate" style={{ color: 'hsl(var(--foreground))' }}>
              Admin
            </p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Superadmin
            </p>
          </div>
          <button
            aria-label="Log out"
            className="transition-colors duration-150 shrink-0"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(0 55% 55%)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen pb-14 md:pb-0 min-w-0">

        {/* Top bar */}
        <header
          className="h-12 flex items-center justify-between px-5 sticky top-0 z-50 shrink-0"
          style={{
            background: 'hsl(var(--background))',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <h2 className="text-sm font-semibold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            {pageTitle}
          </h2>

          {/* Right-side: user avatar visible on all sizes */}
          <div className="flex items-center gap-3">
            {/* Role badge — desktop only */}
            <span
              className="hidden md:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: 'hsl(160 40% 12%)',
                color: 'hsl(160 55% 55%)',
                border: '1px solid hsl(160 30% 20%)',
              }}
            >
              Superadmin
            </span>
            {/* Initials avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{
                background: 'hsl(160 40% 14%)',
                color: 'hsl(160 60% 55%)',
                border: '1px solid hsl(160 35% 22%)',
              }}
            >
              {initials('Admin')}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-5 md:px-6 md:py-6 max-w-7xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 flex items-center justify-around z-50 px-1"
        style={{
          background: 'hsl(var(--card))',
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-150"
              style={{ color: active ? 'hsl(160 60% 55%)' : 'hsl(var(--muted-foreground))' }}
            >
              <item.icon size={18} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[9px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
