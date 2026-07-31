import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { Shield, ArrowRight, Music, Users, CheckCircle2 } from "lucide-react";

export default async function MezmurEligibilityDashboard() {
  const events = await prisma.event.findMany({
    where: {
      eventType: { in: ["MEZMUR_REGULAR", "MEZMUR_BEGINNERS", "MEZMUR_CONTINUOUS"] },
      isActive: true,
    },
    include: {
      _count: { select: { attendances: true } },
      eligibilityRule: true,
    },
    orderBy: { date: "desc" },
    take: 12
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mezmur Eligibility</h1>
        <p className="text-sm opacity-50">Track singer eligibility for services based on their attendance scores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/mezmur/events/${e.id}/eligibility`}
            className="group rounded-xl border border-[hsl(var(--border))] p-6 transition-all hover:border-[hsl(25_70%_40%)] flex flex-col justify-between"
            style={{ background: "hsl(var(--card))" }}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-[hsl(25_70%_45%)]/10 text-[hsl(25_70%_45%)]">
                  <Shield size={20} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] opacity-50 uppercase">
                  {e.eventType.replace("MEZMUR_", "")}
                </span>
              </div>
              <h3 className="font-bold text-sm truncate">{e.title}</h3>
              <p className="text-[10px] opacity-40 mt-1">{new Date(e.date).toLocaleDateString()}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[11px] opacity-60">
                    <CheckCircle2 size={12} />
                    <span>{e.eligibilityRule ? e.eligibilityRule.name : "No rule applied"}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] opacity-60">
                    <Users size={12} />
                    <span>{e._count.attendances} records</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-[hsl(25_70%_45%)]">
              View Report <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}

        {events.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed rounded-xl" style={{ borderColor: "hsl(var(--border))" }}>
                <Shield size={48} className="mx-auto mb-4" />
                <p className="text-sm font-medium">Create a Mezmur event to start tracking eligibility.</p>
            </div>
        )}
      </div>
    </div>
  );
}
