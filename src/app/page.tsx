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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here's an overview of your organization.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-1 transition-all hover:border-primary/50">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">Total Members</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{totalMembers}</div>
          <p className="text-xs text-muted-foreground">+0% from last month</p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-1 transition-all hover:border-primary/50">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">Attendance Rate</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          {/* TODO: Implement real attendance rate */}
          <div className="text-2xl font-bold">{attendanceRate}</div>
          <p className="text-xs text-muted-foreground">This week's average</p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-1 transition-all hover:border-primary/50">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">Pending Permissions</h3>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </div>
          {/* TODO: Implement real pending permissions count */}
          <div className="text-2xl font-bold">{pendingPermissions}</div>
          <p className="text-xs text-muted-foreground">Requires review</p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-1 transition-all hover:border-primary/50">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">Upcoming Events</h3>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          {/* TODO: Implement real upcoming events count */}
          <div className="text-2xl font-bold">{upcomingEventsCount}</div>
          <p className="text-xs text-muted-foreground">Next 7 days</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Recent Members */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold tracking-tight">Recent Members</h2>
            <Link href="/members" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <div className="space-y-4">
            {!users ? (
              <div className="p-6 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                Database not connected. Run <code className="px-1 py-0.5 rounded bg-muted">db:seed</code>
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                No members found.
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user, i) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background transition-colors hover:bg-accent/50 group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {(user.fullName ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium leading-none">{user.fullName ?? "Unnamed user"}</p>
                        <p className="text-sm text-muted-foreground mt-1">{user.memberType?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                      {formatter.format(user.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events (Stub) */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold tracking-tight">Upcoming Events</h2>
            <Link href="/events" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg text-center">
             <Calendar className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
             <p className="text-sm text-muted-foreground">No events scheduled</p>
             {/* TODO: Render actual upcoming events list here */}
          </div>
        </div>

      </div>
    </div>
  );
}
