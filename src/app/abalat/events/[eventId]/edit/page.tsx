'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

interface EventForm {
  title: string;
  description: string;
  location: string;
  date: string;
  targetRoles: string[];
  eligibilityRuleId: string;
}

interface Rule { id: string; name: string }

export default function EditEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [form, setForm] = useState<EventForm>({ title: '', description: '', location: '', date: '', targetRoles: [], eligibilityRuleId: '' });
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/abalat/events/${eventId}`).then((response) => response.json()),
      fetch('/api/abalat/eligibility-rules').then((response) => response.json()),
    ]).then(([event, availableRules]) => {
      if (event.error) throw new Error(event.error);
      setForm({
        title: event.title ?? '',
        description: event.description ?? '',
        location: event.location ?? '',
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
        targetRoles: event.targetRoles ?? [],
        eligibilityRuleId: event.eligibilityRuleId ?? '',
      });
      setRules(Array.isArray(availableRules) ? availableRules : []);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/abalat/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: new Date(form.date).toISOString(), eligibilityRuleId: form.eligibilityRuleId || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update event');
      router.push(`/abalat/events/${eventId}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/abalat/events/${eventId}`} className="inline-flex items-center gap-2 text-sm"><ArrowLeft size={16} /> Back to event</Link>
      <div>
        <h1 className="text-2xl font-bold">Edit event</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Update the event details and schedule.</p>
      </div>
      {error && <p className="rounded border border-red-500/40 p-3 text-sm text-red-500">{error}</p>}
      <form onSubmit={submit} className="space-y-4 rounded-lg border p-6">
        <label className="block text-sm font-semibold">Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded border bg-transparent px-3 py-2" /></label>
        <label className="block text-sm font-semibold">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded border bg-transparent px-3 py-2" rows={3} /></label>
        <label className="block text-sm font-semibold">Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 w-full rounded border bg-transparent px-3 py-2" /></label>
        <label className="block text-sm font-semibold">Date and time<input required type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full rounded border bg-transparent px-3 py-2" /></label>
        <label className="block text-sm font-semibold">Eligibility rule<select value={form.eligibilityRuleId} onChange={(e) => setForm({ ...form, eligibilityRuleId: e.target.value })} className="mt-1 w-full rounded border bg-transparent px-3 py-2"><option value="">No rule</option>{rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.name}</option>)}</select></label>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded bg-[hsl(160_70%_32%)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} />{saving ? <Loader2 size={15} className="animate-spin" /> : 'Save changes'}</button>
      </form>
    </div>
  );
}
