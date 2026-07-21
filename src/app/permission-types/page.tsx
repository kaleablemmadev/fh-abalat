// src/app/permission-types/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Loader2, ChevronRight } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

interface PermissionType {
  id: string;
  name: string;
  description: string | null;
  category: 'DURATION_BASED' | 'DAY_BASED';
  durationMonths: number | null;
  durationYears: number | null;
  appliesToChore: boolean;
  appliesToSunday: boolean;
  specificDays: number[];
  appliesToSundays: boolean;
}

export default function PermissionTypesPage() {
  const [types, setTypes] = useState<PermissionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/permission-types');
      if (!response.ok) {
        throw new Error('Failed to load permission types');
      }
      const data = await response.json();
      setTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission type?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/permission-types/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete');
      }
      setTypes(types.filter(t => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    return category === 'DURATION_BASED' ? 'Duration Based' : 'Day Based';
  };

  const getCategoryDescription = (type: PermissionType) => {
    if (type.category === 'DURATION_BASED') {
      const parts = [];
      if (type.durationMonths) parts.push(`${type.durationMonths} months`);
      if (type.durationYears) parts.push(`${type.durationYears} years`);
      const appliesTo = [];
      if (type.appliesToChore) appliesTo.push('Chore');
      if (type.appliesToSunday) appliesTo.push('Sunday');
      return `Excused for ${parts.join(', ')} (${appliesTo.join(' & ')})`;
    } else {
      const parts = [];
      if (type.specificDays.length > 0) {
        parts.push(`Days: ${type.specificDays.join(', ')}`);
      }
      if (type.appliesToSundays) {
        parts.push('All Sundays');
      }
      return parts.join(', ') || 'No specific days configured';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Loading permission types...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Permission Types' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Permission Types
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Create and manage permission types for member attendance
          </p>
        </div>
        <Link
          href="/permission-types/new"
          className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold transition-colors duration-150"
          style={{
            background: 'hsl(160 70% 32%)',
            color: '#fff',
          }}
        >
          <Plus size={14} />
          Create Type
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
        {types.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              <ChevronRight size={20} className="rotate-90" />
            </div>
            <p className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>
              No permission types
            </p>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Create your first permission type to get started
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {types.map((type) => (
              <li
                key={type.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg transition-colors duration-150 hover:bg-[hsl(var(--accent))]"
                style={{
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {type.name}
                    </p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: 'hsl(var(--muted))',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {getCategoryLabel(type.category)}
                    </span>
                  </div>
                  {type.description && (
                    <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {type.description}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {getCategoryDescription(type)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/permission-types/${type.id}/edit`}
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
                    onClick={() => handleDelete(type.id)}
                    disabled={deletingId === type.id}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors duration-150 disabled:opacity-50"
                    style={{
                      background: 'hsl(0 40% 12%)',
                      color: 'hsl(0 55% 55%)',
                      border: '1px solid hsl(0 30% 20%)',
                    }}
                  >
                    {deletingId === type.id ? (
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
