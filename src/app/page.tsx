/* ./page.tsx */
export const dynamic = "force-dynamic";

import { Users, Calendar, ShieldAlert, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
  const { prisma } = await import("../lib/prisma");
  const formatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  
  // Existing query
  const users = await prisma.user
    .findMany({
      take: 10,
      where: { type: "MEMBER" },
      orderBy: {
        createdAt: "desc",
      },
    })
    .catch(() => undefined);

  // TODO: Fetch total members count if no query exists for it, currently using length of recent users as a fallback stub
  const totalMembers = users?.length || 0;
  
  // TODO: Fetch this week's attendance rate
  const attendanceRate = "—";
  
  // TODO: Fetch pending permission requests
  const pendingPermissions = 0;
  
  // TODO: Fetch upcoming events
  const upcomingEventsCount = 0;

  const statCards = [
    {
      label: 'Total Members',
      value: totalMembers,
      sub: 'Registered members',
      icon: Users,
      href: '/members',
    },
    {
      label: 'Attendance Rate',
      value: attendanceRate,
      sub: "This week's average",
      icon: TrendingUp,
      href: '/attendance/chore',
    },
    {
      label: 'Pending Permissions',
      value: pendingPermissions,
      sub: 'Requires review',
      icon: ShieldAlert,
      href: '/permissions',
    },
    {
      label: 'Upcoming Events',
      value: upcomingEventsCount,
      sub: 'Next 7 days',
      icon: Calendar,
      href: '/events',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page heading */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Welcome back. Here&apos;s an overview of your organization.
        </p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group block rounded-lg p-5 transition-all duration-150"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'hsl(160 84% 39% / 0.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.label}
              </p>
              <div
                className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                style={{ background: 'hsl(160 40% 12%)', color: 'hsl(160 60% 55%)' }}
              >
                <card.icon size={14} />
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight mb-1" style={{ color: 'hsl(var(--foreground))' }}>
              {card.value}
            </div>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {card.sub}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Content grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent Members */}
        <div
          className="rounded-lg"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Recent Members
            </p>
            <Link
              href="/members"
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: 'hsl(160 60% 55%)' }}
            >
              View all →
            </Link>
          </div>
          
          <div className="p-3">
            {!users ? (
              <div
                className="rounded p-6 text-center text-sm"
                style={{
                  border: '1px dashed hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                Database not connected. Run{' '}
                <code className="px-1 py-0.5 rounded text-xs">db:seed</code>
              </div>
            ) : users.length === 0 ? (
              <div
                className="rounded p-6 text-center text-sm"
                style={{
                  border: '1px dashed hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                No members found.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                {users.map((user) => (
                  <li key={user.id} className="flex items-center justify-between py-2 px-2 rounded transition-colors duration-150 hover:bg-[hsl(var(--accent))]">
                    <div className="flex items-center gap-3">
                      {/* Initials avatar */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{
                          background: 'hsl(160 40% 12%)',
                          color: 'hsl(160 60% 55%)',
                          border: '1px solid hsl(160 30% 20%)',
                        }}
                      >
                        {(user.fullName ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none" style={{ color: 'hsl(var(--foreground))' }}>
                          {user.fullName ?? 'Unnamed user'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {user.memberType?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <time className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {formatter.format(user.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div
          className="rounded-lg flex flex-col"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid hsl(var(--border))' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Upcoming Events
            </p>
            <Link
              href="/events"
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: 'hsl(160 60% 55%)' }}
            >
              View all →
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {/* TODO: Render actual upcoming events list here */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              <Calendar size={18} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>No events scheduled</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Events will appear here when created
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
