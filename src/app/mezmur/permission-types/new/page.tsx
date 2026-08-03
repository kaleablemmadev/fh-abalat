// /mezmur/permission-types/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, X } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

export default function NewMezmurPermissionTypePage() {
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

      const response = await fetch('/api/mezmur/permission-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create permission type');
      }

      router.push('/mezmur/permission-types');
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
          { label: 'የፈቃድ ዐይነቶች', href: '/mezmur/permission-types' },
          { label: 'ዐዲስ ፈቃድ መዝግብ' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          ዐዲስ የመዝሙር ፈቃድ መዝግብ
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          የዘማሪዎች አቴንዳንስ የሚሆን ዐዲስ ፈቃድ መዝግብ
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
              የፈቃድ መጠሪያ *
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
              placeholder="ምሳሌ... የዓመት ፈቃድ፣ የሠርክ ፈቃድ..."
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              የፈቃዱ ማብራሪያ
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
              placeholder="ይህ ፈቃድ ለምን ዐይነት ሁኔታ እንደሚሆን አብራራ..."
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              የፈቃድ ምድብ *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCategory('DURATION_BASED')}
                className="flex-1 rounded px-3 py-2 text-sm font-medium transition-colors duration-150"
                style={
                  category === 'DURATION_BASED'
                    ? {
                        background: 'hsl(25 70% 32%)',
                        color: '#fff',
                      }
                    : {
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        border: '1px solid hsl(var(--border))',
                      }
                }
              >
              በጊዜ ገደብ
              </button>
              <button
                type="button"
                onClick={() => setCategory('DAY_BASED')}
                className="flex-1 rounded px-3 py-2 text-sm font-medium transition-colors duration-150"
                style={
                  category === 'DAY_BASED'
                    ? {
                        background: 'hsl(25 70% 32%)',
                        color: '#fff',
                      }
                    : {
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                        border: '1px solid hsl(var(--border))',
                      }
                }
              >
                በቀን መሠረት
              </button>
            </div>
          </div>

          {category === 'DURATION_BASED' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    ጊዜ ገደብ (በወር)
                  </label>
                  <input
                    type="number"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    min="0"
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    ጊዜ ገደብ (በዓመት)
                  </label>
                  <input
                    type="number"
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
                    min="0"
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  የሚተገበረው ለ
                </label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appliesToChore}
                      onChange={(e) => setAppliesToChore(e.target.checked)}
                      className="rounded"
                    />
                    <span style={{ color: 'hsl(var(--foreground))' }}>የሠርክ አቴንዳንስ</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appliesToSunday}
                      onChange={(e) => setAppliesToSunday(e.target.checked)}
                      className="rounded"
                    />
                    <span style={{ color: 'hsl(var(--foreground))' }}>የእሑድ አቴንዳንስ</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {category === 'DAY_BASED' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  የተወሰኑ ቀናት
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    min="1"
                    max="30"
                    className="flex-1 rounded border px-3 py-2 text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    placeholder="ቀን (1-30)"
                  />
                  <button
                    type="button"
                    onClick={addDay}
                    className="rounded px-3 py-2 text-sm font-medium transition-colors duration-150"
                    style={{
                      background: 'hsl(25 70% 32%)',
                      color: '#fff',
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {specificDays.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {specificDays.map((day) => (
                      <span
                        key={day}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{
                          background: 'hsl(var(--muted))',
                          color: 'hsl(var(--foreground))',
                        }}
                      >
                        {day}
                        <button
                          type="button"
                          onClick={() => removeDay(day)}
                          className="hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={appliesToSundays}
                  onChange={(e) => setAppliesToSundays(e.target.checked)}
                  className="rounded"
                />
                <span style={{ color: 'hsl(var(--foreground))' }}>ለእሑዶች በሙሉ ይተገበራል</span>
              </label>
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

        <div className="flex gap-2">
          <Link
            href="/mezmur/permission-types"
            className="rounded px-4 py-2 text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            ተው
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 flex items-center gap-2"
            style={{
              background: 'hsl(25 70% 32%)',
              color: '#fff',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                በማስቀመጥ ላይ...
              </>
            ) : (
              'ፈቃድ መዝግብ'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
