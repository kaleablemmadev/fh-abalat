// /abalat/eligibility-rules/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Plus, X } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

interface Criterion {
  id: string;
  eventType: string;
  minAttendances: number;
  lookbackMonths: number;
  isTotalAttendance: boolean;
}

export default function NewEligibilityRulePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', eventType: 'chore', minAttendances: 5, lookbackMonths: 2, isTotalAttendance: false },
    { id: '2', eventType: 'sunday', minAttendances: 2, lookbackMonths: 2, isTotalAttendance: false },
  ]);

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        id: Date.now().toString(),
        eventType: 'chore',
        minAttendances: 1,
        lookbackMonths: 1,
        isTotalAttendance: false,
      },
    ]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) {
      setError('ቢያንስ አንድ መስፈርት መሙላት ግዴታ ነው');
      return;
    }
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, field: keyof Criterion, value: any) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!name.trim()) {
        throw new Error('Name is required');
      }

      if (criteria.length === 0) {
        throw new Error('ቢያንስ አንድ መስፈርት ይሙሉ');
      }

      const response = await fetch('/api/abalat/eligibility-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description || null,
          criteria: criteria.map(c => ({
            eventType: c.eventType,
            minAttendances: c.minAttendances,
            lookbackMonths: c.lookbackMonths,
            isTotalAttendance: c.isTotalAttendance,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create rule');
      }

      router.push('/abalat/eligibility-rules');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Breadcrumb
        items={[
          { label: 'የአገልግሎት መስፈርቶች', href: '/abalat/eligibility-rules' },
          { label: 'መስፈርት አውጣ' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          የአገልግሎት መስፈርት መዝግብ
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          በአንድ በዓል አባላት እንዲያገለግሉ የሚወስን መስፈርት አስቀምጥ
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
              የመስፈርት መጠሪያ *
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
              placeholder="ምሳሌ... መደበኛ የበዓል መስፈርት፣ ..."
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              የመስፈርቱ ማብራሪያ
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
              placeholder="ይህ መስፈርት መቼና ለምን እንደሚያገለግል አብራራ..."
            />
          </div>

          {/* Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                መስፈርት *
              </label>
              <button
                type="button"
                onClick={addCriterion}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors duration-150"
                style={{
                  background: 'hsl(160 40% 12%)',
                  color: 'hsl(160 60% 55%)',
                  border: '1px solid hsl(160 30% 20%)',
                }}
              >
                <Plus size={12} />
                ዐዲስ መስፈርት
              </button>
            </div>

            {criteria.map((c, index) => (
              <div
                key={c.id}
                className="rounded p-3 space-y-2"
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    መስፈርት {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCriterion(c.id)}
                    className="p-1 rounded hover:bg-[hsl(var(--accent))] transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      የበዓል ዐይነት
                    </label>
                    <select
                      value={c.eventType}
                      onChange={(e) => updateCriterion(c.id, 'eventType', e.target.value)}
                      className="w-full rounded border px-2 py-1 text-xs"
                      style={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      <option value="chore">የሠርክ አገልግሎት</option>
                      <option value="sunday">የእሑድ አገልግሎት</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      ቢያንስ ስንት አቴንዳንስ
                    </label>
                    <input
                      type="number"
                      value={c.minAttendances}
                      onChange={(e) => updateCriterion(c.id, 'minAttendances', parseInt(e.target.value) || 0)}
                      className="w-full rounded border px-2 py-1 text-xs"
                      style={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                      min={0}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      ላለፈው ስንት ወር
                    </label>
                    <input
                      type="number"
                      value={c.lookbackMonths}
                      onChange={(e) => updateCriterion(c.id, 'lookbackMonths', parseInt(e.target.value) || 1)}
                      className="w-full rounded border px-2 py-1 text-xs"
                      style={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                      min={1}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id={`total-${c.id}`}
                      checked={c.isTotalAttendance}
                      onChange={(e) => updateCriterion(c.id, 'isTotalAttendance', e.target.checked)}
                      className="rounded"
                      style={{ accentColor: 'hsl(160 70% 32%)' }}
                    />
                    <label htmlFor={`total-${c.id}`} className="text-[10px]" style={{ color: 'hsl(var(--foreground))' }}>
                      አጠቃላይ አቴንዳንሶች (ሁሉም ዐይነቶች)
                    </label>
                  </div>
                </div>
              </div>
            ))}
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
            href="/abalat/eligibility-rules"
            className="inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium transition-colors duration-150"
            style={{
              background: 'transparent',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            ተመለስ
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
            {isLoading ? 'ምዝገባ ላይ...' : 'መስፈርት መዝግብ'}
          </button>
        </div>
      </form>
    </div>
  );
}