'use client'

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, CheckSquare, Shield, Settings, LogOut, User } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Attendance', href: '/attendance/chore', icon: CheckSquare }, // defaulting to chore, or could make a generic dashboard
  { name: 'Permissions', href: '/permissions', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Basic derivation of page title from pathname
  const pageTitle = navItems.find(item => pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/'))?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tighter text-primary">Abalat</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-sm transition-all animate-fade-in ${
                  isActive
                    ? 'bg-accent text-primary border-l-2 border-primary pl-2'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User profile area in sidebar */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-medium leading-none">Admin</p>
              <p className="text-xs text-muted-foreground mt-1">Superadmin</p>
            </div>
          </div>
          <button className="text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0 relative overflow-hidden">
        {/* Top bar (Desktop & Mobile) */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 sticky top-0 z-50">
          <h2 className="text-lg font-semibold animate-slide-in">{pageTitle}</h2>
          
          {/* Mobile top-right actions could go here */}
          <div className="md:hidden flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary">
              <User size={16} />
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="flex-1 overflow-auto p-4 md:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card flex items-center justify-around z-50 px-2">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon size={20} className={isActive ? 'stroke-2' : ''} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
