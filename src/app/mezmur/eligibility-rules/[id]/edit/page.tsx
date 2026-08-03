// /mezmur/eligibility-rules/[id]/edit/page.tsx
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

export default function EditMezmurEligibilityRulePage() {
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
        const response = await fetch(`/api/mezmur/eligibility-rules/${id}`);
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
        eventType: 'mezmur',
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

      const response = await fetch(`/api/mezmur/eligibility-rules/${id}`, {
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

      router.push('/mezmur/eligibility-rules');
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
          { label: 'የመዝሙር ማሟላት መስፈርቶች', href: '/mezmur/eligibility-rules' },
          { label: name || 'Edit' },
          { label: 'አርትመል' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          የመዝሙር ማሟላት መስፈርት አርትመል
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          የዚህ መስፈርት ክፍልት ያስቀምጥ
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
              placeholder="ምሳሌ... መደበኛ የመዝሙር በዓል መስፈርት፣ ..."
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
                  background: 'hsl(25 40% 12%)',
                  color: 'hsl(25 60% 55%)',
                  border: '1px solid hsl(25 30% 20%)',
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
                      <option value="mezmur">የመዝሙር በዓላት</option>
                      <option value="mezmur_regular">መዝሙር መደበኛ</option>
                      <option value="mezmur_beginners">መዝሙር ለመነሽዎች</option>
                      <option value="mezmur_continuous">መዝሙር ቋለል</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      አንድ አቴንዳንስ
                    </label>
                    <input
                      type="number"
                      value={c.minAttendances}
                      onChange={(e) => updateCriterion(c.id, 'minAttendances', parseInt(e.target.value))}
                      className="w-full rounded border px-2 py-1 text-xs"
                      style={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                      min="0"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      የክፍል ቀን (ወራት)
                    </label>
                    <input
                      type="number"
                      value={c.lookbackMonths}
                      onChange={(e) => updateCriterion(c.id, 'lookbackMonths', parseInt(e.target.value))}
                      className="w-full rounded border px-2 py-1 text-xs"
                      style={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                      }}
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-1 flex items-center">
                    <input
                      type="checkbox"
                      id={`total-${c.id}`}
                      checked={c.isTotalAttendance}
                      onChange={(e) => updateCriterion(c.id, 'isTotalAttendance', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor={`total-${c.id}`} className="text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      ጠቅም አቴንዳንስ
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded text-sm" style={{ background: 'hsl(0 40% 12%)', color: 'hsl(0 55% 55%)' }}>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link
            href="/mezmur/eligibility-rules"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <ArrowLeft size={16} />
            ተመለል
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 disabled:opacity-50"
            style={{
              background: 'hsl(25 70% 32%)',
              color: '#fff',
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                በመስራል...
              </>
            ) : (
              'መስፈርት አስቀምጥ'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
