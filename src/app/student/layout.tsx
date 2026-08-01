'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { GraduationCap, BookOpen, CheckSquare, Award, LogOut, User, Menu, X } from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        if (session.memberType !== 'COURSE_STUDENT') {
          router.push('/');
        }
        setUser(session);
      } catch (e) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    document.cookie = 'mode_session=; path=/; max-age=0';
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { name: 'My Dashboard', href: '/student', icon: GraduationCap },
    // Future items:
    // { name: 'Attendance', href: '/student/attendance', icon: CheckSquare },
    // { name: 'My Grades', href: '/student/grades', icon: Award },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Mobile Top Bar */}
      <header className="md:hidden h-14 flex items-center justify-between px-4 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] sticky top-0 z-50">
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 rounded-lg">
          <Menu size={20} />
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--primary))]">Student Portal</span>
        <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--primary))]">
          {user.fullName?.[0]}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transform transition-transform duration-200 md:relative md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-14 flex items-center justify-between px-6 border-b border-[hsl(var(--border))]">
            <span className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--primary))]">Student Portal</span>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === item.href ? 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]'
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[hsl(var(--border))]">
            <div className="flex items-center gap-3 px-2 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-xs font-bold text-[hsl(var(--primary))]">
                {user.fullName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{user.fullName}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-bold">Student</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen overflow-x-hidden">
          <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
