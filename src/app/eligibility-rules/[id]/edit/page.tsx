// src/app/eligibility-rules/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface RuleData {
  id: string;
  name: string;
  description: string | null;
  criteria: Criterion[];
}

export default function EditEligibilityRulePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  useEffect(() => {
    async function fetchRule() {
      try {
        const response = await fetch(`/api/eligibility-rules/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load rule');
        }
        const data: RuleData = await response.json();
        setName(data.name);
        setDescription(data.description || '');
        setCriteria(data.criteria.map(c => ({ ...c, id: c.id || Date.now().toString() })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rule');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchRule();
    }
  }, [id]);

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
      setError('At least one criterion is required');
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
    setIsSaving(true);

    try {
      if (!name.trim()) {
        throw new Error('Name is required');
      }

      if (criteria.length === 0) {
        throw new Error('At least one criterion is required');
      }

      const response = await fetch(`/api/eligibility-rules/${id}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Failed to update rule');
      }

      router.push('/eligibility-rules');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Breadcrumb
        items={[
          { label: 'Eligibility Rules', href: '/eligibility-rules' },
          { label: name || 'Edit' },
          { label: 'Edit' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Edit Eligibility Rule
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Update the criteria for this eligibility rule
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
              Rule Name *
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
              placeholder="e.g., Regular Member Eligibility"
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
              placeholder="Describe when this rule applies..."
            />
          </div>

          {/* Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Criteria *
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
                Add Criterion
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
                    Criterion {index + 1}
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
                      Event Type
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
                      <option value="chore">Chore</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Min Attendances
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
                      Lookback Months
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
                      Total Attendance (all types)
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
            href="/eligibility-rules"
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
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
            style={{
              background: 'hsl(160 70% 32%)',
              color: '#fff',
            }}
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}