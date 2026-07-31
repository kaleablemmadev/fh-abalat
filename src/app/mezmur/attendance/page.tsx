import Link from "next/link";
import { Music, Users, Calendar, ArrowRight } from "lucide-react";

export default function MezmurAttendanceDashboard() {
  const groups = [
    {
      id: "REGULAR",
      name: "Regular Group",
      description: "Sunday morning service members",
      icon: Music,
      href: "/mezmur/attendance/regular",
      color: "hsl(200 65% 55%)",
    },
    {
      id: "BEGINNERS",
      name: "Beginners Group",
      description: "New students and learners",
      icon: Users,
      href: "/mezmur/attendance/beginners",
      color: "hsl(160 60% 55%)",
    },
    {
      id: "CONTINUOUS",
      name: "Continuous Group",
      description: "Advanced students and practice sessions",
      icon: Users,
      href: "/mezmur/attendance/continuous",
      color: "hsl(38 65% 55%)",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          Mezmur Attendance
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
          Select a group to track and manage attendance records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={group.href}
            className="group rounded-lg p-6 transition-all duration-150 flex flex-col justify-between h-full border border-[hsl(var(--border))]"
            style={{
              background: "hsl(var(--card))",
            }}
          >
            <div>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${group.color}15`, color: group.color }}
              >
                <group.icon size={24} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {group.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                {group.description}
              </p>
            </div>

            <div className="flex items-center gap-1 mt-6 text-xs font-medium" style={{ color: group.color }}>
              Track Attendance <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
