// src/app/permission-types/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, X } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

export default function NewPermissionTypePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<'DURATION_BASED' | 'DAY_BASED'>('DURATION_BASED');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Duration-based fields
  const [durationMonths, setDurationMonths] = useState('');
  const [durationYears, setDurationYears] = useState('');
  const [appliesToChore, setAppliesToChore] = useState(false);
  const [appliesToSunday, setAppliesToSunday] = useState(false);
  
  // Day-based fields
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [newDay, setNewDay] = useState('');
  const [appliesToSundays, setAppliesToSundays] = useState(false);

  const addDay = () => {
    const dayNum = parseInt(newDay);
    if (dayNum >= 1 && dayNum <= 30 && !specificDays.includes(newDay)) {
      setSpecificDays([...specificDays, newDay]);
      setNewDay('');
    }
  };

  const removeDay = (day: string) => {
    setSpecificDays(specificDays.filter(d => d !== day));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name.trim()) {
        throw new Error('Name is required');
      }

      if (category === 'DURATION_BASED') {
        if (!durationMonths && !durationYears) {
          throw new Error('Please specify duration (months or years)');
        }
        if (!appliesToChore && !appliesToSunday) {
          throw new Error('Please select at least one attendance type (Chore or Sunday)');
        }
      }

      if (category === 'DAY_BASED') {
        if (specificDays.length === 0 && !appliesToSundays) {
          throw new Error('Please specify at least one day or enable Sundays');
        }
      }

      const payload: any = {
        name: name.trim(),
        description: description || null,
        category,
      };

      if (category === 'DURATION_BASED') {
        payload.durationMonths = durationMonths ? parseInt(durationMonths) : null;
        payload.durationYears = durationYears ? parseInt(durationYears) : null;
        payload.appliesToChore = appliesToChore;
        payload.appliesToSunday = appliesToSunday;
      } else {
        payload.specificDays = specificDays.map(Number);
        payload.appliesToSundays = appliesToSundays;
      }

      const response = await fetch('/api/permission-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create permission type');
      }

      router.push('/permission-types');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create permission type');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Breadcrumb
        items={[
          { label: 'Permission Types', href: '/permission-types' },
          { label: 'Create Type' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Create Permission Type
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Define a new type of permission for member attendance
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
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Permission Type Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              required
              placeholder="e.g., Medical Leave"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              rows={2}
              placeholder="Describe when this permission applies..."
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              Permission Category *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCategory('DURATION_BASED')}
                className="flex-1 rounded px-3 py-2 text-sm font-medium transition-colors duration-150"
                style={
                  category === 'DURATION_BASED'
                    ? {
                        background: 'hsl(160 70% 32%)',
                        color: '#fff',
                      }
                    : {
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        border: '1px solid hsl(var(--border))',
                      }
                }
              >
                Duration Based
              </button>
              <button
                type="button"
                onClick={() => setCategory('DAY_BASED')}
                className="flex-1 rounded px-3 py-2 text-sm font-medium transition-colors duration-150"
                style={
                  category === 'DAY_BASED'
                    ? {
                        background: 'hsl(160 70% 32%)',
                        color: '#fff',
                      }
                    : {
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        border: '1px solid hsl(var(--border))',
                      }
                }
              >
                Day Based
              </button>
            </div>
          </div>

          {category === 'DURATION_BASED' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    min={0}
                    placeholder="e.g., 3"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    min={0}
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Applies To
                </label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={appliesToChore}
                      onChange={(e) => setAppliesToChore(e.target.checked)}
                      className="rounded"
                      style={{ accentColor: 'hsl(160 70% 32%)' }}
                    />
                    Chore Attendance
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={appliesToSunday}
                      onChange={(e) => setAppliesToSunday(e.target.checked)}
                      className="rounded"
                      style={{ accentColor: 'hsl(160 70% 32%)' }}
                    />
                    Sunday Attendance
                  </label>
                </div>
              </div>
            </>
          )}

          {category === 'DAY_BASED' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Specific Days of Month
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="flex-1 rounded border px-3 py-2 text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    min={1}
                    max={30}
                    placeholder="Day (1-30)"
                  />
                  <button
                    type="button"
                    onClick={addDay}
                    className="inline-flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors duration-150"
                    style={{
                      background: 'hsl(160 40% 12%)',
                      color: 'hsl(160 60% 55%)',
                      border: '1px solid hsl(160 30% 20%)',
                    }}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                {specificDays.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {specificDays.map((day) => (
                      <span
                        key={day}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                        style={{
                          background: 'hsl(var(--muted))',
                          color: 'hsl(var(--muted-foreground))',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        Day {day}
                        <button
                          type="button"
                          onClick={() => removeDay(day)}
                          className="hover:text-[hsl(var(--foreground))]"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="appliesToSundays"
                  checked={appliesToSundays}
                  onChange={(e) => setAppliesToSundays(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: 'hsl(160 70% 32%)' }}
                />
                <label htmlFor="appliesToSundays" className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  Excused on all Sundays
                </label>
              </div>
            </>
          )}
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
            href="/permission-types"
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
            {isLoading ? 'Creating...' : 'Create Type'}
          </button>
        </div>
      </form>
    </div>
  );
}
