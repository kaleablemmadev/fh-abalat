'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layout,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatEthiopianDate, dateToEthiopian } from '@/src/lib/ethiopiancal';

export default function TimelineManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTimelineEvents();
  }, []);

  async function fetchTimelineEvents() {
    setLoading(true);
    try {
      const res = await fetch('/api/abalat/events?isAcademicTimeline=true');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);
    try {
      // Assuming a generic event creation API that supports isAcademicTimeline
      const res = await fetch('/api/abalat/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date).toISOString(),
          isAcademicTimeline: true,
          mode: 'COURSE'
        }),
      });
      if (res.ok) {
        setFormData({ title: '', description: '', date: '' });
        setIsCreating(false);
        fetchTimelineEvents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Academic Timeline
          </h1>
          <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
            Manage events that appear on the student's visual timeline.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20"
        >
          {isCreating ? 'Cancel' : <><Plus size={18} /> Add Timeline Event</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-lg animate-slide-up max-w-2xl mx-auto">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Layout size={18} className="text-blue-500" />
            New Academic Event
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold opacity-60 uppercase tracking-widest">Event Title</label>
              <input
                className="w-full h-10 rounded-lg border border-[hsl(var(--border))] px-4 bg-[hsl(var(--background))] text-sm outline-none focus:border-blue-500 transition-all"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., First Semester Final Exams"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold opacity-60 uppercase tracking-widest">Event Date (Gregorian)</label>
              <input
                type="date"
                className="w-full h-10 rounded-lg border border-[hsl(var(--border))] px-4 bg-[hsl(var(--background))] text-sm outline-none focus:border-blue-500 transition-all"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold opacity-60 uppercase tracking-widest">Brief Description</label>
              <textarea
                className="w-full min-h-[80px] rounded-lg border border-[hsl(var(--border))] p-4 bg-[hsl(var(--background))] text-sm outline-none focus:border-blue-500 transition-all resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details about this milestone..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-30 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Add to Timeline
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Date (Eth)</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Title</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center animate-pulse opacity-40 italic">Loading timeline...</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center opacity-30 italic">No timeline events found. Add one to show on student dashboards.</td></tr>
              ) : (
                events.map((event) => {
                  const ethDate = dateToEthiopian(new Date(event.date));
                  return (
                    <tr key={event.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold">{formatEthiopianDate(ethDate, 'short')}</div>
                        <div className="text-[10px] opacity-40">{new Date(event.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">{event.title}</td>
                      <td className="px-6 py-4 text-xs opacity-60 max-w-md truncate">{event.description || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-red-500/50 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
