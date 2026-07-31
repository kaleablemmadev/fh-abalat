import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { Music, CheckSquare, Shield, ArrowRight, Play, Upload, UserPlus, ListMusic, Calendar, Users } from "lucide-react";

export default async function MezmurHomePage() {
  // Fetch stats from Prisma
  const [personnelCount, songCount, eventCount, categoryCount] = await Promise.all([
    prisma.user.count({
      where: {
        type: "MEMBER",
        isActive: true,
        OR: [
          { memberType: "REGULAR_MEMBER" },
          { mezmurEnrollments: { some: { status: "ACTIVE" } } }
        ]
      }
    }),
    prisma.musicFile.count(),
    prisma.event.count({
      where: {
        eventType: { in: ["MEZMUR_REGULAR", "MEZMUR_BEGINNERS", "MEZMUR_CONTINUOUS"] },
        isActive: true
      }
    }),
    prisma.musicCategory.count(),
  ]);

  const stats = [
    { label: "Active Members", value: personnelCount.toString(), icon: Users, href: "/mezmur/members", color: "hsl(160 60% 55%)" },
    { label: "Library Songs", value: songCount.toString(), icon: Music, href: "/mezmur/music", color: "hsl(200 65% 55%)" },
    { label: "Scheduled Events", value: eventCount.toString(), icon: CheckSquare, href: "/mezmur/schedule", color: "hsl(38 65% 55%)" },
    { label: "Music Categories", value: categoryCount.toString(), icon: ListMusic, href: "/mezmur/music-categories", color: "hsl(25 70% 45%)" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          Mezmur Dashboard
        </h1>
        <p className="text-sm mt-1 opacity-50">
          Ethiopian Orthodox Hymn & Choir Management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-[hsl(var(--border))] p-6 transition-all hover:border-[hsl(25_70%_40%)] flex flex-col justify-between"
            style={{ background: "hsl(var(--card))" }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div
                  className="p-2 rounded-lg transition-colors"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold mt-4" style={{ color: "hsl(var(--foreground))" }}>
                {stat.value}
              </p>
              <p className="text-xs font-medium opacity-50">{stat.label}</p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[hsl(25_70%_45%)] opacity-0 group-hover:opacity-100 transition-opacity">
              Manage <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[hsl(var(--border))] p-6" style={{ background: "hsl(var(--card))" }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Play size={18} className="opacity-50" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/mezmur/music/upload"
              className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] hover:border-[hsl(25_70%_45%)] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Upload size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Upload Song</p>
                <p className="text-[10px] opacity-40">Add to library</p>
              </div>
            </Link>

            <Link
              href="/mezmur/members/new"
              className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] hover:border-[hsl(25_70%_45%)] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <UserPlus size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Enroll Member</p>
                <p className="text-[10px] opacity-40">Assign to group</p>
              </div>
            </Link>

            <Link
              href="/mezmur/attendance"
              className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] hover:border-[hsl(25_70%_45%)] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <CheckSquare size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Take Attendance</p>
                <p className="text-[10px] opacity-40">Mark sessions</p>
              </div>
            </Link>

            <Link
              href="/mezmur/eligibility"
              className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] hover:border-[hsl(25_70%_45%)] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-bold">Eligibility</p>
                <p className="text-[10px] opacity-40">View reports</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] p-6" style={{ background: "hsl(var(--card))" }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar size={18} className="opacity-50" /> Upcoming
          </h2>
          <div className="space-y-4">
            <p className="text-sm opacity-40 italic py-8 text-center">No upcoming events found. Check the schedule to create one.</p>
            <Link
              href="/mezmur/schedule"
              className="w-full h-10 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
            >
              View Full Schedule
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
