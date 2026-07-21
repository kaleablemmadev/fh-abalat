// src/app/events/[eventId]/components/EventEligibilitySelector.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, CheckCircle, Loader2, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Criteria {
  id: string;
  eventType: string;
  minAttendances: number;
  lookbackMonths: number;
  isTotalAttendance: boolean;
}

interface Rule {
  id: string;
  name: string;
  description: string | null;
  criteria: Criteria[];
}

interface EventEligibilitySelectorProps {
  eventId: string;
  currentRuleId: string | null;
  allRules: Rule[];
}

export default function EventEligibilitySelector({
  eventId,
  currentRuleId,
  allRules,
}: EventEligibilitySelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(currentRuleId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleApplyRule = async () => {
    if (!selectedRuleId) {
      setError('Please select an eligibility rule');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/events/${eventId}/eligibility-rule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eligibilityRuleId: selectedRuleId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply eligibility rule');
      }

      setSuccess(true);
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveRule = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/events/${eventId}/eligibility-rule`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove eligibility rule');
      }

      setSelectedRuleId(null);
      setSuccess(true);
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove rule');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRule = allRules.find(r => r.id === selectedRuleId);

  return (
    <div
      className="rounded-lg p-6"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Settings size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Eligibility Rule
        </h2>
      </div>

      <div className="space-y-4">
        {/* Rule Selector */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
              Select Eligibility Rule
            </label>
            <select
              value={selectedRuleId || ''}
              onChange={(e) => setSelectedRuleId(e.target.value || null)}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <option value="">None</option>
              {allRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {selectedRuleId && (
              <button
                onClick={handleRemoveRule}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-50"
                style={{
                  background: 'hsl(0 40% 12%)',
                  color: 'hsl(0 55% 55%)',
                  border: '1px solid hsl(0 30% 20%)',
                }}
              >
                Remove
              </button>
            )}
            <button
              onClick={handleApplyRule}
              disabled={isSaving || !selectedRuleId}
              className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
              style={{
                background: 'hsl(160 70% 32%)',
                color: '#fff',
              }}
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isSaving ? 'Saving...' : 'Apply Rule'}
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
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

        {success && (
          <div
            className="rounded p-3 text-sm font-medium flex items-center gap-2"
            style={{
              background: 'hsl(160 40% 10%)',
              border: '1px solid hsl(160 30% 20%)',
              color: 'hsl(160 55% 58%)',
            }}
          >
            <CheckCircle size={14} />
            Eligibility rule applied successfully
          </div>
        )}

        {/* Selected Rule Details */}
        {selectedRule && (
          <div
            className="rounded p-4 mt-2"
            style={{
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {selectedRule.name}
                </p>
                {selectedRule.description && (
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {selectedRule.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRule.criteria.map((c, index) => (
                    <span
                      key={c.id}
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {c.isTotalAttendance ? (
                        <>Total: {c.minAttendances} in {c.lookbackMonths}m</>
                      ) : (
                        <>{c.eventType}: {c.minAttendances} in {c.lookbackMonths}m</>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/events/${eventId}/eligibility`}
                className="inline-flex items-center gap-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap"
                style={{ color: 'hsl(160 60% 55%)' }}
              >
                View Report
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* No rules message */}
        {allRules.length === 0 && (
          <div
            className="rounded p-4 text-center"
            style={{
              background: 'hsl(var(--background))',
              border: '1px dashed hsl(var(--border))',
            }}
          >
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No eligibility rules created yet.
            </p>
            <Link
              href="/eligibility-rules/new"
              className="inline-flex items-center gap-1 text-sm font-medium mt-2 transition-colors duration-150"
              style={{ color: 'hsl(160 60% 55%)' }}
            >
              Create your first rule →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}