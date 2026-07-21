// /src/app/attendance/[type]/list/page.tsx
import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { dateToEthiopian } from "@/src/lib/ethiopiancal";
import Breadcrumb from "@/src/components/navigation/Breadcrumb";

export default async function AttendanceListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  const validTypes = ['chore', 'sunday'] as const;
  if (!validTypes.includes(type as typeof validTypes[number])) {
    notFound();
  }

  const isChore = type === 'chore';
  const eventType = isChore ? 'CHORE' : 'SUNDAY';

  const events = await prisma.event.findMany({
    where: {
      eventType,
    },
    include: {
      _count: {
        select: {
          attendances: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  const accentColor = isChore
    ? { bg: 'hsl(160 40% 12%)', text: 'hsl(160 60% 55%)' }
    : { bg: 'hsl(38 40% 12%)', text: 'hsl(38 60% 55%)' };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Attendance', href: `/attendance/${type}` },
          { label: `${isChore ? 'Chore' : 'Sunday'} History` },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          {isChore ? 'Chore' : 'Sunday'} Attendance History
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          All past {isChore ? 'chore attendance days' : 'Sunday morning attendance records'}
        </p>
      </div>

      {/* List */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              <Calendar size={20} />
            </div>
            <p className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              No {isChore ? 'chore' : 'Sunday'} attendance records
            </p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Go to the {isChore ? 'chore' : 'Sunday'} attendance page to start tracking.
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
            {events.map((event) => {
              const ethDate = dateToEthiopian(new Date(event.date));
              return (
                <li
                  key={event.id}
                  className="flex items-center justify-between p-4 hover:bg-[hsl(var(--accent))] transition-colors duration-150"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: accentColor.bg,
                        color: accentColor.text,
                      }}
                    >
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                        {ethDate.month} {ethDate.day}፣ {ethDate.year} ዓ.ም.
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(event.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      <Users size={12} />
                      {event._count.attendances} marked
                    </span>
                    <Link
                      href={`/events/${event.id}/attendance`}
                      className="inline-flex items-center gap-1 text-sm font-medium transition-colors duration-150"
                      style={{ color: 'hsl(160 60% 55%)' }}
                    >
                      View
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}