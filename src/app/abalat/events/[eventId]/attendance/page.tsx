// /abalat/events/[eventId]/attendance/page.tsx
import prisma from "@/src/lib/prisma";
import AttendanceGrid from "./components/AttendanceGrid";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { dateToEthiopian } from "@/src/lib/ethiopiancal";
import Breadcrumb from "@/src/components/navigation/Breadcrumb";
import { checkMemberPermission } from "@/src/services/permission.service";

export default async function SingleDayAttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  // 1. Fetch the Event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event || event.courseClassId || event.eventType !== "EVENT" || !event.isRecurring) {
    notFound();
  }

  const ethDate = dateToEthiopian(new Date(event.date));

  // 2. Fetch all Members
  const members = await prisma.user.findMany({
    where: {
      type: "MEMBER",
      NOT: { roles: { has: "COURSE_STUDENT" } },
    },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  // 3. Fetch all AttendanceTypes and filter "Late"
  const allAttendanceTypes = await prisma.attendanceType.findMany({
    orderBy: { name: "asc" },
  });
  const attendanceTypes = allAttendanceTypes.filter(t => t.name.toLowerCase() !== 'late');

  // 4. Fetch existing Attendance for this event
  const existingAttendances = await prisma.attendance.findMany({
    where: { eventId },
    select: { memberId: true, attendanceTypeId: true },
  });

  // 5. Determine event type based on event title
  let eventType: 'CHORE' | 'SUNDAY' | 'EVENT' = 'EVENT';
  if (event.title.toLowerCase().includes('chore')) {
    eventType = 'CHORE';
  } else if (event.title.toLowerCase().includes('sunday')) {
    eventType = 'SUNDAY';
  }

  // 6. Check permissions for each member for this event date
  const memberPermissions = new Map<string, { hasPermission: boolean; permissionType?: string; reason?: string }>();
  const eventDate = new Date(event.date);
  
  for (const member of members) {
    const permissionCheck = await checkMemberPermission(member.id, eventDate, eventType);
    memberPermissions.set(member.id, permissionCheck);
  }

  // 7. Find the permission attendance type ID (if exists)
  const permissionAttendanceType = attendanceTypes.find(type => 
    type.name.toLowerCase().includes('permission') || type.name.toLowerCase().includes('excused')
  );

  // 8. Pre-fill attendance data with permission stance for members with active permissions
  // Start with existing attendances, then add permission-based defaults for members without attendance
  const initialAttendanceWithPermissions = [...existingAttendances];
  
  // Add permission-based attendance for members who don't have existing attendance
  const membersWithExistingAttendance = new Set(existingAttendances.map(a => a.memberId));
  
  for (const member of members) {
    if (!membersWithExistingAttendance.has(member.id) && 
        memberPermissions.get(member.id)?.hasPermission && 
        permissionAttendanceType) {
      initialAttendanceWithPermissions.push({
        memberId: member.id,
        attendanceTypeId: permissionAttendanceType.id,
      });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'በዓላት', href: '/abalat/events' },
          { label: event.title, href: `/abalat/events/${eventId}` },
          { label: 'አቴንዳንስ' },
        ]}
      />

      {/* Event header */}
      <div
        className="pb-4"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}
      >
        <h1
          className="text-xl font-bold tracking-tight mb-2"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {event.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <Calendar size={11} />
            {ethDate.month} {ethDate.day}፣ {ethDate.year} ዓ.ም.
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <Calendar size={11} />
            {new Date(event.date).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {event.location && (
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <MapPin size={11} />
              {event.location}
            </span>
          )}
        </div>
      </div>

      <AttendanceGrid
        key={eventId}
        eventId={eventId}
        members={members}
        attendanceTypes={attendanceTypes}
        initialAttendance={initialAttendanceWithPermissions}
        memberPermissions={memberPermissions}
      />
    </div>
  );
}