// src/app/events/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ethMonthNames, getEthiopianToday, ethiopianToGregorianDate } from '@/src/lib/ethiopiancal';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

interface FormData {
  title: string;
  description: string;
  location: string;
  ethiopianYear: string;
  ethiopianMonth: string;
  ethiopianDay: string;
  hour: string;
  minute: string;
  isRecurring: boolean;
  targetMemberTypes: string[];
}

const memberTypeOptions = [
  { value: 'REGULAR_MEMBER', label: 'Regular Member' },
  { value: 'COURSE_STUDENT', label: 'Course Student' },
  { value: 'YOUTH_STUDENT', label: 'Youth Student' },
];

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const today = getEthiopianToday();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    ethiopianYear: String(today.year),
    ethiopianMonth: '1',
    ethiopianDay: '1',
    hour: '10',
    minute: '00',
    isRecurring: false,
    targetMemberTypes: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const monthNumber = parseInt(formData.ethiopianMonth);
      const day = parseInt(formData.ethiopianDay);
      const year = parseInt(formData.ethiopianYear);
      const hour = parseInt(formData.hour) || 0;
      const minute = parseInt(formData.minute) || 0;

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (year < 1900 || year > 2100) {
        throw new Error('Please enter a valid Ethiopian year (1900-2100)');
      }

      if (day < 1 || day > 30) {
        throw new Error('Please enter a valid day (1-30)');
      }

      if (monthNumber < 1 || monthNumber > 13) {
        throw new Error('Please select a valid month');
      }

      // Convert Ethiopian date to Gregorian
      const gregorianDateObj = ethiopianToGregorianDate({
        year: year,
        month: monthNumber,
        day: day,
      });

      if (!gregorianDateObj || !gregorianDateObj.year) {
        throw new Error('Failed to convert Ethiopian date to Gregorian');
      }

      const gregorianDate = new Date(
        gregorianDateObj.year,
        gregorianDateObj.month - 1,
        gregorianDateObj.day,
        hour,
        minute
      );

      if (isNaN(gregorianDate.getTime())) {
        throw new Error('Invalid date created from Ethiopian date conversion');
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        date: gregorianDate.toISOString(),
        location: formData.location || undefined,
        ethiopianYear: year,
        ethiopianMonth: monthNumber,
        ethiopianDay: day,
        isRecurring: formData.isRecurring,
        recurringMonth: formData.isRecurring ? monthNumber : null,
        recurringDay: formData.isRecurring ? day : null,
        targetMemberTypes: formData.targetMemberTypes.length > 0 ? formData.targetMemberTypes : undefined,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.details
          ? `${responseData.error}: ${responseData.details}`
          : responseData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      router.push('/events');
      router.refresh();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Breadcrumb
        items={[
          { label: 'Events', href: '/events' },
          { label: 'Create Event' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Create New Event
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Add a new event to the calendar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className="rounded-lg p-6 space-y-4"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              required
              placeholder="e.g., Special Service"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              rows={3}
              placeholder="Event description..."
            />
          </div>

          {/* Ethiopian Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Ethiopian Date *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={formData.ethiopianMonth}
                onChange={(e) => setFormData({ ...formData, ethiopianMonth: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                required
              >
                {Object.entries(ethMonthNames).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={formData.ethiopianDay}
                onChange={(e) => setFormData({ ...formData, ethiopianDay: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                min={1}
                max={30}
                required
                placeholder="Day"
              />
              <input
                type="number"
                value={formData.ethiopianYear}
                onChange={(e) => setFormData({ ...formData, ethiopianYear: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                min={1900}
                max={2100}
                required
                placeholder="Year"
              />
            </div>
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Time
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={formData.hour}
                onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                min={0}
                max={23}
                placeholder="Hour"
              />
              <input
                type="number"
                value={formData.minute}
                onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
                className="rounded border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                min={0}
                max={59}
                placeholder="Minute"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              placeholder="e.g., Main Hall"
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="rounded"
              style={{ accentColor: 'hsl(160 70% 32%)' }}
            />
            <label htmlFor="isRecurring" className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
              This event repeats every year on this date
            </label>
          </div>

          {/* Target Member Types */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Target Members
            </label>
            <div className="space-y-1">
              {memberTypeOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.targetMemberTypes.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          targetMemberTypes: [...formData.targetMemberTypes, option.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          targetMemberTypes: formData.targetMemberTypes.filter((t) => t !== option.value),
                        });
                      }
                    }}
                    className="rounded"
                    style={{ accentColor: 'hsl(160 70% 32%)' }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div
            className="rounded p-3 text-sm font-medium"
            style={{
              background: 'hsl(0 40% 10%)',
              border: '1px solid hsl(0 40% 22%)',
              color: 'hsl(0 55% 62%)',
            }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors duration-150"
            style={{
              background: 'transparent',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
            style={{
              background: 'hsl(160 70% 32%)',
              color: '#fff',
            }}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {isLoading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}