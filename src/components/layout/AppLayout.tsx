/* /components/layout/AppLayout.tsx */
'use client'

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Users, Calendar, CheckSquare, Shield, Settings, LogOut,
  ChevronRight, FileText, BarChart3, LucideIcon, ArrowLeft, Clock, Lock, Menu, X
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

interface AppLayoutProps {
  children: ReactNode;
  navItems: NavSection[];
  modeLabel: string;
}

/** Derive initials from a display name */
function initials(name: string) {
  if (!name) return 'AD';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AppLayout({ children, navItems, modeLabel }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; fullName: string; type: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname.endsWith('/login');
  const isRegistrationPage = pathname.endsWith('/admin-registration');

  useEffect(() => {
    setIsMounted(true);
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));

        // Verify session mode matches layout mode
        if (!session.mode || session.mode !== modeLabel.toUpperCase()) {
          // Silent failure if already on login/registration page
          if (isLoginPage || isRegistrationPage) {
            return;
          }
          throw new Error('Invalid mode for session');
        }

        setUser({
          id: session.userId,
          fullName: session.fullName || 'Admin User',
          type: session.userType || 'ADMIN'
        });
      } catch (e) {
        // Only log unexpected errors, not mode mismatches which are handled by redirect
        if (e instanceof Error && e.message !== 'Invalid mode for session') {
          console.error('Session validation failed:', e);
        }

        if (!isLoginPage && !isRegistrationPage) {
          const loginPath = modeLabel.toUpperCase() === 'MEMBER' ? '/' : `/${modeLabel.toLowerCase()}/login`;
          router.push(loginPath);
        }
      }
    } else if (!isLoginPage && !isRegistrationPage) {
      const loginPath = modeLabel.toUpperCase() === 'MEMBER' ? '/' : `/${modeLabel.toLowerCase()}/login`;
      router.push(loginPath);
    }
  }, [isLoginPage, isRegistrationPage, modeLabel, router, pathname]);

  const handleLogout = () => {
    document.cookie = 'mode_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    const loginPath = modeLabel.toUpperCase() === 'MEMBER' ? '/' : `/${modeLabel.toLowerCase()}/login`;
    router.push(loginPath);
    router.refresh();
  };

  if (!isMounted) return null;

  // Don't show layout for login or registration pages
  if (isLoginPage || isRegistrationPage) {
    return <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>{children}</div>;
  }

  const displayNavItems = [...navItems];

  // Add Superadmin specific items
  if (user?.type === 'SUPERADMIN') {
    displayNavItems.push({
      label: 'አድሚን ክትትል',
      items: [
        { name: 'አድሚን መቀበያ', href: `/${modeLabel.toLowerCase()}/admin-approvals`, icon: Shield },
        { name: 'ኦዲት መዝገብ', href: `/${modeLabel.toLowerCase()}/audit-log`, icon: Clock },
        { name: 'ስርዓት ቅንብሮች', href: `/${modeLabel.toLowerCase()}/superadmin-settings`, icon: Lock },
      ]
    });
  }

  const allItems = displayNavItems.flatMap(section => section.items);

  const pageTitle =
    allItems.find(
      (item) =>
        pathname === item.href ||
        (pathname.startsWith(item.href) && item.href !== '/'),
    )?.name || 'Dashboard';

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href) && href !== '/');

  const userFullName = user?.fullName || 'Admin';
  const userType = user?.type === 'SUPERADMIN' ? 'ዋና አድሚን' : 'አድሚን';

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>

      {/* ── Mobile Menu Button ───────────────────────────────────────────── */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-14 left-3 z-50 p-2 rounded-lg transition-colors duration-150"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        }}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile Menu Overlay ──────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 bottom-0 w-72 h-full overflow-y-auto"
            style={{ background: 'hsl(var(--card))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile menu header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
              <span
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: 'hsl(var(--primary))' }}
              >
                {modeLabel === 'Abalat' ? 'አባላት ጉዳይ ክፍል' : modeLabel === 'Course' ? 'ኮርስ ክፍል' : 'መዝሙር ክፍል'}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded transition-colors duration-150"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile menu items */}
            <nav className="p-4 space-y-4">
              {displayNavItems.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  {section.label && (
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                      {section.label}
                    </p>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActive(item.href);
                      const LinkComponent = item.external ? 'a' : Link;
                      const linkProps = item.external ? { href: item.href, target: "_blank", rel: "noopener noreferrer" } : { href: item.href };

                      return (
                        <LinkComponent
                          key={item.name}
                          {...(linkProps as any)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150"
                          style={
                            active
                              ? {
                                  color: 'hsl(var(--primary))',
                                  background: 'hsl(var(--primary) / 0.08)',
                                }
                              : {
                                  color: 'hsl(var(--muted-foreground))',
                                }
                          }
                        >
                          <item.icon
                            size={18}
                            style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                            className="shrink-0"
                          />
                          <span className="truncate">{item.name}</span>
                        </LinkComponent>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Mobile menu footer */}
            <div className="p-4 border-t mt-auto" style={{ borderColor: 'hsl(var(--border))' }}>
              <Link
                href="/admin-portal"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                <ArrowLeft size={18} />
                <span>ወደዋና ገጽ ተመለስ</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0"
        style={{
          background: 'hsl(var(--card))',
          borderRight: '1px solid hsl(var(--border))',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {modeLabel === 'Abalat' ? 'አባላት ጉዳይ ክፍል' : modeLabel === 'Course' ? 'ኮርስ ክፍል' : 'መዝሙር ክፍል'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto no-scrollbar">
          {displayNavItems.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.label && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const LinkComponent = item.external ? 'a' : Link;
                  const linkProps = item.external ? { href: item.href, target: "_blank", rel: "noopener noreferrer" } : { href: item.href };

                  return (
                    <LinkComponent
                      key={item.name}
                      {...(linkProps as any)}
                      className="group flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-all duration-150"
                      style={
                        active
                          ? {
                              color: 'hsl(var(--primary))',
                              background: 'hsl(var(--primary) / 0.08)',
                              borderLeft: '2px solid hsl(var(--primary))',
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
                        style={{ color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                        className="shrink-0 transition-colors duration-150 group-hover:text-zinc-200"
                      />
                      <span className="transition-colors duration-150 group-hover:text-zinc-200 truncate">
                        {item.name}
                      </span>
                    </LinkComponent>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="px-3 py-2 space-y-0.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <Link
            href="/admin-portal"
            className="group flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-all duration-150"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <ArrowLeft size={15} className="shrink-0 transition-colors duration-150 group-hover:text-zinc-200" />
            <span className="transition-colors duration-150 group-hover:text-zinc-200">
              ወደዋና ገጽ ተመለስ
            </span>
          </Link>
        </div>

        {/* User area */}
        <div
          className="px-3 py-3 flex items-center gap-2.5"
          style={{ borderTop: '1px solid hsl(var(--border))' }}
        >
          {/* Initials avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{
              background: 'hsl(var(--primary) / 0.15)',
              color: 'hsl(var(--primary))',
              border: '1px solid hsl(var(--primary) / 0.25)',
            }}
          >
            {initials(userFullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-none truncate" style={{ color: 'hsl(var(--foreground))' }}>
              {userFullName}
            </p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {userType}
            </p>
          </div>
          <button
            onClick={handleLogout}
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
      <main className="flex-1 flex flex-col min-h-screen pb-0 md:pb-0 min-w-0 md:pl-0 pl-0">

        {/* Top bar */}
        <header
          className="h-14 md:h-12 flex items-center justify-between px-4 md:px-5 sticky top-0 z-40 shrink-0"
          style={{
            background: 'hsl(var(--background))',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-sm md:text-sm font-semibold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
              {pageTitle}
            </h2>
          </div>

          {/* Mode switcher */}
          <div className="flex items-center gap-1 rounded p-0.5" style={{ background: 'hsl(var(--muted))' }}>
            <Link
              href="/abalat"
              className="text-[10px] md:text-[10px] font-medium px-2 py-1 rounded transition-colors duration-150"
              style={{
                color: modeLabel === 'Abalat' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                background: modeLabel === 'Abalat' ? 'hsl(var(--card))' : 'transparent',
              }}
            >
              አባላት
            </Link>
            <Link
              href="/course"
              className="text-[10px] md:text-[10px] font-medium px-2 py-1 rounded transition-colors duration-150"
              style={{
                color: modeLabel === 'Course' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                background: modeLabel === 'Course' ? 'hsl(var(--card))' : 'transparent',
              }}
            >
              ኮርስ
            </Link>
            <Link
              href="/mezmur"
              className="text-[10px] md:text-[10px] font-medium px-2 py-1 rounded transition-colors duration-150"
              style={{
                color: modeLabel === 'Mezmur' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                background: modeLabel === 'Mezmur' ? 'hsl(var(--card))' : 'transparent',
              }}
            >
              መዝሙር
            </Link>
          </div>

          {/* Right-side: user avatar visible on all sizes */}
          <div className="flex items-center gap-3">
            {/* Role badge — desktop only */}
            <span
              className="hidden md:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: 'hsl(var(--primary) / 0.12)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsl(var(--primary) / 0.2)',
              }}
            >
              {userType}
            </span>
            {/* Initials avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{
                background: 'hsl(var(--primary) / 0.15)',
                color: 'hsl(var(--primary))',
                border: '1px solid hsl(var(--primary) / 0.25)',
              }}
            >
              {initials(userFullName)}
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
    </div>
  );
}
