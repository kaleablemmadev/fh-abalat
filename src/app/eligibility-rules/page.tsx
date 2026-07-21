// src/app/eligibility-rules/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Loader2, ChevronRight } from 'lucide-react';

interface EligibilityRule {
  id: string;
  name: string;
  description: string | null;
  criteria: {
    id: string;
    eventType: string;
    minAttendances: number;
    lookbackMonths: number;
    isTotalAttendance: boolean;
  }[];
}

export default function EligibilityRulesPage() {
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/eligibility-rules');
      if (!response.ok) {
        throw new Error('Failed to load eligibility rules');
      }
      const data = await response.json();
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this eligibility rule?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/eligibility-rules/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete');
      }
      setRules(rules.filter(r => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Loading eligibility rules...
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
            Eligibility Rules
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Create and manage rules for event eligibility
          </p>
        </div>
        <Link
          href="/eligibility-rules/new"
          className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150"
          style={{
            background: 'hsl(160 70% 32%)',
            color: '#fff',
          }}
        >
          <Plus size={14} />
          Create Rule
        </Link>
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

      <div
        className="rounded-lg p-4"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              <ChevronRight size={20} className="rotate-90" />
            </div>
            <p className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              No eligibility rules
            </p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Create your first eligibility rule to get started
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg transition-colors duration-150 hover:bg-[hsl(var(--accent))]"
                style={{
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {rule.name}
                    </p>
                  </div>
                  {rule.description && (
                    <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {rule.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {rule.criteria.map((c, index) => (
                      <span
                        key={c.id}
                        className="text-xs px-1.5 py-0.5 rounded"
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
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/eligibility-rules/${rule.id}/edit`}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors duration-150"
                    style={{
                      background: 'hsl(var(--muted))',
                      color: 'hsl(var(--muted-foreground))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <Edit size={12} />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={deletingId === rule.id}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
                    style={{
                      background: 'hsl(0 40% 12%)',
                      color: 'hsl(0 55% 55%)',
                      border: '1px solid hsl(0 30% 20%)',
                    }}
                  >
                    {deletingId === rule.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}