// src/app/events/[eventId]/page.tsx
import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, Clock, Users, Settings } from "lucide-react";
import { dateToEthiopian } from "@/src/lib/ethiopiancal";
import EventEligibilitySelector from "./components/EventEligibilitySelector";
import Breadcrumb from "@/src/components/navigation/Breadcrumb";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eligibilityRule: {
        include: {
          criteria: true,
        },
      },
      _count: {
        select: { attendances: true },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Fetch all eligibility rules for the dropdown
  const allRules = await prisma.eligibilityRule.findMany({
    include: {
      criteria: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const ethDate = dateToEthiopian(new Date(event.date));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: event.title },
        ]}
      />

      {/* Event header */}
      <div
        className="rounded-lg p-6"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          {event.title}
        </h1>
        {event.description && (
          <p className="text-sm mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {event.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-4">
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
            <Clock size={11} />
            {new Date(event.date).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
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
          <span
            className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium"
            style={{
              background: 'hsl(160 40% 12%)',
              color: 'hsl(160 60% 55%)',
              border: '1px solid hsl(160 30% 20%)',
            }}
          >
            <Users size={11} />
            {event._count.attendances} attending
          </span>
        </div>

        {event.eligibilityRule && (
          <div className="mt-4">
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium"
              style={{
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <Settings size={11} />
              Eligibility: {event.eligibilityRule.name}
            </span>
          </div>
        )}
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={`/events/${eventId}/attendance`}
          className="rounded-lg p-4 transition-all duration-150 hover:scale-[1.02]"
          style={{
            background: 'hsl(160 40% 12%)',
            border: '1px solid hsl(160 30% 20%)',
            color: 'hsl(160 60% 55%)',
          }}
        >
          <p className="text-sm font-semibold">Mark Attendance</p>
          <p className="text-xs mt-1 opacity-70">Record who attended this event</p>
        </Link>
        <Link
          href={`/events/${eventId}/eligibility`}
          className="rounded-lg p-4 transition-all duration-150 hover:scale-[1.02]"
          style={{
            background: 'hsl(38 40% 12%)',
            border: '1px solid hsl(38 30% 20%)',
            color: 'hsl(38 60% 55%)',
          }}
        >
          <p className="text-sm font-semibold">View Eligibility Report</p>
          <p className="text-xs mt-1 opacity-70">View current eligibility report for this event</p>
        </Link>
      </div>

      {/* Eligibility Rule Selector */}
      <EventEligibilitySelector
        eventId={eventId}
        currentRuleId={event.eligibilityRuleId}
        allRules={allRules}
      />
    </div>
  );
}