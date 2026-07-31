import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import MezmurSingleEventGrid from "./components/MezmurSingleEventGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getAdminId() {
  try {
    const admin = await prisma.user.findFirst({ where: { type: "ADMIN" } }) || await prisma.user.findFirst({ where: { type: "SUPERADMIN" } });
    return admin?.id || "system-admin";
  } catch (error) {
    console.error('Database connection error in getAdminId:', error);
    return "system-admin";
  }
}

const eventToGroupMap: Record<string, string> = {
  MEZMUR_REGULAR: "CONTINUOUS",
  MEZMUR_BEGINNERS: "BEGINNERS",
  MEZMUR_CONTINUOUS: "CONTINUOUS",
};

export default async function MezmurSingleEventAttendancePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) notFound();

  const groupType = eventToGroupMap[event.eventType] as any;

  // Fetch singers enrolled in this specific group
  const enrollments = await prisma.mezmurEnrollment.findMany({
    where: { groupType, status: "ACTIVE" },
    include: { student: { select: { id: true, fullName: true } } },
    orderBy: { student: { fullName: "asc" } }
  });

  const members = enrollments.map(e => e.student);

  const attendanceTypes = await prisma.attendanceType.findMany({
    orderBy: { value: "desc" }
  });

  const initialAttendance = await prisma.attendance.findMany({
    where: { eventId },
    select: { memberId: true, attendanceTypeId: true }
  });

  const adminId = await getAdminId();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6">
      <div className="flex items-center gap-3">
        <Link href="/mezmur/schedule" className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] opacity-60">
            <ArrowLeft size={18} />
        </Link>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
            <p className="text-sm opacity-50">{new Date(event.date).toLocaleDateString()} · {event.eventType.replace("MEZMUR_", "")}</p>
        </div>
      </div>

      <MezmurSingleEventGrid
        eventId={eventId}
        members={members as any}
        attendanceTypes={attendanceTypes}
        initialAttendance={initialAttendance}
        adminId={adminId}
      />
    </div>
  );
}
