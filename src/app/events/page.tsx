/* events/page.tsx */
'use client';

import { ethTodayDate } from "@/src/lib/ethiopiancal";
import { useEffect, useState } from "react";

interface EventProps {
  id: string;
  title: string;
  description?: string;
  date: string;
  eligibilityRule: string;
}

export default function EventsPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<EventProps[]>([]);

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

  if (error) {
    return <div className="flex justify-center items-center">Failed to load events</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-[12px] text-gray-400">
          {ethTodayDate.month} {ethTodayDate.day}፣ {ethTodayDate.year} ዓ.ም.
        </p>
      </div>

      <div className="m-6 border border-gray-300 rounded-lg p-4">
        {events.length === 0 ? (
          <p className="text-lg">No events currently scheduled.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="flex gap-5 border-b pb-3">
                <div className="flex flex-col">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-sm text-gray-600">{e.date}</p>
                </div>
                <div className="flex flex-col">
                  <p>18</p>
                  <p className="text-sm text-gray-600">{e.eligibilityRule}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}