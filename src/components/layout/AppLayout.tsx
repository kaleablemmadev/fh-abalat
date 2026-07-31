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
    <div className="min-h-screen flex flex-col md:flex-row bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">

      {/* ── Mobile Header ────────────────────────────────────────────────── */}
      <header
        className="md:hidden h-14 flex items-center justify-between px-4 sticky top-0 z-50 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg transition-colors duration-150 hover:bg-[hsl(var(--accent))]"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span
            className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--primary))]"
          >
            {modeLabel === 'Abalat' ? 'አባላት' : modeLabel === 'Course' ? 'ኮርስ' : 'መዝሙር'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]"
          >
            {initials(userFullName)}
          </div>
        </div>
      </header>

      {/* ── Mobile Menu Overlay ──────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] md:hidden bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 bottom-0 w-[280px] h-full overflow-y-auto bg-[hsl(var(--card))] animate-slide-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile menu header */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
              <span
                className="text-xs font-bold tracking-widest uppercase text-[hsl(var(--primary))]"
              >
                {modeLabel === 'Abalat' ? 'አባላት ጉዳይ ክፍል' : modeLabel === 'Course' ? 'ኮርስ ክፍል' : 'መዝሙር ክፍል'}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 rounded-lg transition-colors duration-150 hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile menu items */}
            <nav className="p-4 space-y-6">
              {displayNavItems.map((section, idx) => (
                <div key={idx} className="space-y-2">
                  {section.label && (
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground)/0.7)]">
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
                          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                            active
                              ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]'
                              : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                          }`}
                        >
                          <item.icon
                            size={18}
                            className={`shrink-0 ${active ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}
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
            <div className="p-4 border-t border-[hsl(var(--border))] mt-auto">
              <Link
                href="/admin-portal"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all duration-150"
              >
                <ArrowLeft size={18} />
                <span>ወደዋና ገጽ ተመለስ</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] transition-all duration-150 mt-2"
              >
                <LogOut size={18} />
                <span>ውጣ (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))]"
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[hsl(var(--border))] flex items-center justify-between">
          <span
            className="text-xs font-bold tracking-widest uppercase text-[hsl(var(--primary))]"
          >
            {modeLabel === 'Abalat' ? 'አባላት ጉዳይ ክፍል' : modeLabel === 'Course' ? 'ኮርስ ክፍል' : 'መዝሙር ክፍል'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-4 space-y-8 overflow-y-auto no-scrollbar">
          {displayNavItems.map((section, idx) => (
            <div key={idx} className="space-y-2">
              {section.label && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground)/0.7)] mb-3">
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
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] shadow-sm'
                          : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                      }`}
                    >
                      <item.icon
                        size={16}
                        className={`shrink-0 transition-colors duration-150 ${active ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]'}`}
                      />
                      <span className="truncate">
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
        <div className="px-4 py-3 border-t border-[hsl(var(--border))]">
          <Link
            href="/admin-portal"
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))] transition-all duration-150"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span>ወደዋና ገጽ ተመለስ</span>
          </Link>
        </div>

        {/* User area */}
        <div
          className="px-4 py-4 border-t border-[hsl(var(--border))] flex items-center gap-3"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)] shrink-0"
          >
            {initials(userFullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-none truncate text-[hsl(var(--foreground))]">
              {userFullName}
            </p>
            <p className="text-[10px] mt-1 truncate text-[hsl(var(--muted-foreground))]">
              {userType}
            </p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] transition-all duration-150 shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Desktop Top bar */}
        <header
          className="hidden md:flex h-14 items-center justify-between px-6 sticky top-0 z-40 bg-[hsl(var(--background)/0.8)] backdrop-blur-md border-b border-[hsl(var(--border))] shrink-0"
        >
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))]">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Mode switcher */}
            <div className="flex items-center gap-1 bg-[hsl(var(--muted))] rounded-lg p-1">
              {['Abalat', 'Course', 'Mezmur'].map((m) => (
                <Link
                  key={m}
                  href={`/${m.toLowerCase()}`}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all duration-150 ${
                    modeLabel === m
                      ? 'bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {m === 'Abalat' ? 'አባላት' : m === 'Course' ? 'ኮርስ' : 'መዝሙር'}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3 border-l border-[hsl(var(--border))] pl-6">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.2)]"
              >
                {userType}
              </span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]"
              >
                {initials(userFullName)}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
