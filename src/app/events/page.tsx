// /src/app/events/page.tsx
'use client';

import { formatEthiopianDate, dateToEthiopian } from "@/src/lib/ethiopiancal";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Plus, Trash2, Loader2 } from 'lucide-react';

interface EventProps {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  ethiopianYear?: number;
  ethiopianMonth?: number;
  ethiopianDay?: number;
  eligibilityRule?: string;
  _count?: {
    attendances: number;
  };
}

export default function EventsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<EventProps[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const ethToday = formatEthiopianDate(new Date());

  useEffect(() => {
    async function fetchEvents() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error("Failed to load events");
        }

        const data: EventProps[] = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also remove all attendance records for it.')) {
      return;
    }

    setDeletingId(eventId);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <div className="flex justify-center items-center p-8" style={{ color: 'hsl(0 55% 55%)' }}>
        Error: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Loading events...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Events
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {ethToday || 'Loading Ethiopian date...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{
              background: 'hsl(160 40% 12%)',
              color: 'hsl(160 60% 55%)',
              border: '1px solid hsl(160 30% 20%)',
            }}
          >
            {events.length} events
          </span>
          {/* NEW: Create Event button */}
          <Link
            href="/events/new"
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150"
            style={{
              background: 'hsl(160 70% 32%)',
              color: '#fff',
            }}
          >
            <Plus size={14} />
            Create Event
          </Link>
        </div>
      </div>

      {/* Events list */}
      <div
        className="rounded-lg p-4"
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
            <p className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>No events scheduled</p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Events will appear here when created
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const ethDate = dateToEthiopian(new Date(e.date));
              const attendancesCount = e._count?.attendances ?? 0;
              const isDeleting = deletingId === e.id;

              return (
                <li
                  key={e.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg transition-colors duration-150 hover:bg-[hsl(var(--accent))]"
                  style={{
                    borderBottom: '1px solid hsl(var(--border))',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {e.title}
                    </p>
                    {e.description && (
                      <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {e.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {ethDate.month} {ethDate.day}፣ {ethDate.year} ዓ.ም.
                      </span>
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(e.date).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Link
                        href={`/events/${e.id}/eligibility`}
                        className="inline-flex items-center gap-1 text-sm font-medium transition-colors duration-150"
                        style={{ color: 'hsl(160 60% 55%)' }}
                      >
                        Check Eligibility
                        <ChevronRight size={14} />
                      </Link>
                      {attendancesCount > 0 && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: 'hsl(160 40% 12%)',
                            color: 'hsl(160 60% 55%)',
                          }}
                        >
                          {attendancesCount} attending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.eligibilityRule && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: 'hsl(var(--muted))',
                          color: 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {e.eligibilityRule}
                      </span>
                    )}
                    <Link
                      href={`/events/${e.id}/attendance`}
                      className="inline-flex items-center gap-1 text-sm font-medium transition-colors duration-150"
                      style={{ color: 'hsl(160 60% 55%)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(160 60% 65%)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(160 60% 55%)')}
                    >
                      Mark Attendance
                      <ChevronRight size={14} />
                    </Link>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
                      style={{
                        background: 'hsl(0 40% 12%)',
                        color: 'hsl(0 55% 55%)',
                        border: '1px solid hsl(0 30% 20%)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeleting) {
                          e.currentTarget.style.background = 'hsl(0 40% 18%)';
                          e.currentTarget.style.color = 'hsl(0 55% 65%)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'hsl(0 40% 12%)';
                        e.currentTarget.style.color = 'hsl(0 55% 55%)';
                      }}
                      title="Delete event"
                    >
                      {isDeleting ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      {isDeleting ? '...' : 'Delete'}
                    </button>
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