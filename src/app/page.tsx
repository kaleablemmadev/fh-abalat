// ./page.tsx
export const dynamic = "force-dynamic";

import { Users, Calendar, ShieldAlert, TrendingUp, ChevronRight, UserPlus, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Prisma } from '@/src/generated/prisma/client';

// Types for better type safety
type UserWithAttendance = Prisma.UserGetPayload<{
  include: {
    attendances: {
      include: {
        event: true;
      };
    };
  };
}>;

export default async function Home() {
  const { prisma } = await import("@/src/lib/prisma");
  
  const formatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const dateFormatter = new Intl.DateTimeFormat("en", {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // ─── Fetch all required data in parallel ───────────────────────────
  const [
    members,
    totalMembers,
    upcomingEvents,
    pendingPermissions,
    weeklyAttendance,
  ] = await Promise.all([
    // Recent members (with attendances for stats)
    prisma.user.findMany({
      take: 10,
      where: { type: "MEMBER" },
      include: {
        attendances: {
          include: {
            event: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }).catch(() => [] as UserWithAttendance[]),

    // Total members count
    prisma.user.count({
      where: { type: "MEMBER" },
    }).catch(() => 0),

    // Upcoming events (next 7 days)
    prisma.event.findMany({
      where: {
        date: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 5,
    }).catch(() => []),

    // Pending permissions
    prisma.permission.count({
      where: {
        status: 'PENDING',
      },
    }).catch(() => 0),

    // This week's attendance rate
    (async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      const [totalMembers, attendedMembers] = await Promise.all([
        prisma.user.count({
          where: { type: "MEMBER" },
        }),
        prisma.attendance.groupBy({
          by: ['memberId'],
          where: {
            event: {
              date: {
                gte: startOfWeek,
                lt: endOfWeek,
              },
            },
            attendanceType: {
              name: {
                in: ['Attended', 'Present', 'Yes'],
              },
            },
          },
        }),
      ]);

      return totalMembers > 0 
        ? Math.round((attendedMembers.length / totalMembers) * 100)
        : 0;
    })().catch(() => 0),
  ]);

  // ─── Stats Cards Data ──────────────────────────────────────────────
  const statCards = [
    {
      label: 'Total Members',
      value: totalMembers,
      sub: 'Registered members',
      icon: Users,
      href: '/members',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Attendance Rate',
      value: `${weeklyAttendance}%`,
      sub: "This week's average",
      icon: TrendingUp,
      href: '/attendance/chore',
      trend: weeklyAttendance > 75 ? 'Excellent' : 'Needs improvement',
      trendUp: weeklyAttendance > 75,
    },
    {
      label: 'Pending Permissions',
      value: pendingPermissions,
      sub: 'Requires review',
      icon: ShieldAlert,
      href: '/permissions',
      trend: pendingPermissions > 0 ? 'Action needed' : 'All clear',
      trendUp: pendingPermissions === 0,
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents.length,
      sub: 'Next 7 days',
      icon: Calendar,
      href: '/events',
      trend: upcomingEvents.length > 0 ? `${upcomingEvents.length} events` : 'No events',
      trendUp: upcomingEvents.length > 0,
    },
  ];

  // ─── Get member's last attendance status ──────────────────────────
  const getLastAttendanceStatus = (member: UserWithAttendance) => {
    const lastAttendance = member.attendances?.[0];
    if (!lastAttendance) return null;
    
    const typeName = lastAttendance.attendanceType?.name?.toLowerCase() || '';
    if (typeName.includes('attended') || typeName.includes('present')) {
      return { label: 'Present', color: 'hsl(160 60% 55%)' };
    } else if (typeName.includes('permission') || typeName.includes('excused')) {
      return { label: 'Excused', color: 'hsl(38 60% 55%)' };
    } else if (typeName.includes('absent')) {
      return { label: 'Absent', color: 'hsl(0 55% 55%)' };
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Page Heading ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Welcome back. Here&apos;s an overview of your organization.
          </p>
        </div>
        <Link
          href="/members/new"
          className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0"
          style={{
            background: 'hsl(160 70% 32%)',
            color: '#fff',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(160 70% 38%)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'hsl(160 70% 32%)')}
        >
          <UserPlus size={14} />
          Add Member
        </Link>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group block rounded-lg p-5 transition-all duration-150 hover:scale-[1.02]"
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
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {card.sub}
              </p>
              {card.trend && (
                <span 
                  className="text-[10px] font-medium"
                  style={{ 
                    color: card.trendUp ? 'hsl(160 60% 55%)' : 'hsl(0 55% 55%)',
                  }}
                >
                  {card.trend}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Content Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Recent Members ────────────────────────────────────────── */}
        <div
          className="rounded-lg overflow-hidden"
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
              className="text-xs font-medium transition-colors duration-150 flex items-center gap-1"
              style={{ color: 'hsl(160 60% 55%)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(160 60% 65%)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(160 60% 55%)')}
            >
              View all
              <ChevronRight size={12} />
            </Link>
          </div>
          
          <div className="p-3 max-h-[400px] overflow-y-auto">
            {members.length === 0 ? (
              <div
                className="rounded p-8 text-center"
                style={{
                  border: '1px dashed hsl(var(--border))',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                <Users size={20} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members found.</p>
                <Link
                  href="/members/new"
                  className="text-xs font-medium mt-2 inline-block"
                  style={{ color: 'hsl(160 60% 55%)' }}
                >
                  Add your first member →
                </Link>
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                {members.map((user) => {
                  const lastStatus = getLastAttendanceStatus(user);
                  return (
                    <li 
                      key={user.id} 
                      className="flex items-center justify-between py-2.5 px-2 rounded transition-colors duration-150 hover:bg-[hsl(var(--accent))] group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Initials avatar */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{
                            background: 'hsl(160 40% 12%)',
                            color: 'hsl(160 60% 55%)',
                            border: '1px solid hsl(160 30% 20%)',
                          }}
                        >
                          {(user.fullName ?? 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-none truncate" style={{ color: 'hsl(var(--foreground))' }}>
                            {user.fullName ?? 'Unnamed user'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {user.memberType?.replace('_', ' ') || 'Member'}
                            </p>
                            {lastStatus && (
                              <>
                                <span className="w-1 h-1 rounded-full" style={{ background: 'hsl(var(--muted-foreground))' }} />
                                <span className="text-[10px] font-medium" style={{ color: lastStatus.color }}>
                                  ● {lastStatus.label}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <time className="text-[11px] shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {formatter.format(user.createdAt)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Upcoming Events ───────────────────────────────────────── */}
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
              className="text-xs font-medium transition-colors duration-150 flex items-center gap-1"
              style={{ color: 'hsl(160 60% 55%)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(160 60% 65%)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(160 60% 55%)')}
            >
              View all
              <ChevronRight size={12} />
            </Link>
          </div>
          
          <div className="flex-1 p-4 max-h-[400px] overflow-y-auto">
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                >
                  <Calendar size={20} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>No events scheduled</p>
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Events will appear here when created
                </p>
                <Link
                  href="/events/new"
                  className="text-xs font-medium mt-4 inline-flex items-center gap-1"
                  style={{ color: 'hsl(160 60% 55%)' }}
                >
                  <Calendar size={12} />
                  Create event →
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-lg p-3 transition-all duration-150 hover:bg-[hsl(var(--accent))] group"
                    style={{
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <Link href={`/events/${event.id}/attendance`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))' }}>
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {dateFormatter.format(new Date(event.date))}
                            </span>
                            {event._count.attendances > 0 && (
                              <>
                                <span className="w-1 h-1 rounded-full" style={{ background: 'hsl(var(--muted-foreground))' }} />
                                <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  {event._count.attendances} attending
                                </span>
                              </>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-[11px] mt-1 line-clamp-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                          style={{ background: 'hsl(160 40% 12%)', color: 'hsl(160 60% 55%)' }}
                        >
                          <ChevronRight size={14} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            background: 'hsl(160 40% 12%)',
                            color: 'hsl(160 60% 55%)',
                            border: '1px solid hsl(160 30% 20%)',
                          }}
                        >
                          <Clock size={10} />
                          {new Date(event.date).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {event.eligibilityRuleId && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: 'hsl(var(--muted))',
                              color: 'hsl(var(--muted-foreground))',
                            }}
                          >
                            Eligibility Rule
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}