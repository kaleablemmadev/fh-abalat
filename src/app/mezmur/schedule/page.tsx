import prisma from "@/src/lib/prisma";
import MezmurEventList from "./components/MezmurEventList";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { getEthiopianToday, formatEthiopianDate } from "@/src/lib/ethiopiancal";

export default async function MezmurSchedulePage() {
  const events = await prisma.event.findMany({
    where: {
      eventType: { in: ["MEZMUR_REGULAR", "MEZMUR_BEGINNERS", "MEZMUR_CONTINUOUS"] },
      isActive: true,
    },
    include: {
      _count: { select: { attendances: true } }
    },
    orderBy: { date: "desc" },
  });

  const today = getEthiopianToday();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mezmur Schedule</h1>
          <p className="text-sm opacity-50">{formatEthiopianDate(today)}</p>
        </div>

        <Link
          href="/mezmur/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-sm font-bold transition-all"
        >
          <Plus size={16} />
          Manual Event
        </Link>
      </div>

      <MezmurEventList initialEvents={events as any} />
    </div>
  );
}
