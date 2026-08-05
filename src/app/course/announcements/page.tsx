'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  AlertCircle,
  Bell,
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import { formatEthiopianDate, dateToEthiopian } from '@/src/lib/ethiopiancal';

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'GENERAL',
    notifyStudents: true,
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch('/api/course/announcements?mode=COURSE');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
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
      const res = await fetch('/api/course/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode: 'COURSE' }),
      });
      if (res.ok) {
        setFormData({ title: '', message: '', type: 'GENERAL', notifyStudents: true });
        setIsCreating(false);
        fetchAnnouncements();
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
            Announcements & Notifications
          </h1>
          <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
            Broadcast messages and schedules to all students in the course mode.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20"
        >
          {isCreating ? 'Cancel' : <><Plus size={18} /> New Announcement</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-lg animate-slide-up">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Send size={18} className="text-blue-500" />
            Create New Broadcast
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold opacity-60 uppercase tracking-widest">Title</label>
                <input
                  className="w-full h-10 rounded-lg border border-[hsl(var(--border))] px-4 bg-[hsl(var(--background))] text-sm outline-none focus:border-blue-500 transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Final Exam Schedule"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold opacity-60 uppercase tracking-widest">Priority Type</label>
                <select
                  className="w-full h-10 rounded-lg border border-[hsl(var(--border))] px-4 bg-[hsl(var(--background))] text-sm outline-none focus:border-blue-500 transition-all"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="GENERAL">General News</option>
                  <option value="SCHEDULE">Academic Schedule</option>
                  <option value="URGENT">Urgent/Important</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold opacity-60 uppercase tracking-widest">Message Content</label>
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-[hsl(var(--border))] p-4 bg-[hsl(var(--background))] text-sm outline-none focus:border-blue-500 transition-all resize-none"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your announcement details here..."
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="notifyStudents"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.notifyStudents}
                onChange={e => setFormData({ ...formData, notifyStudents: e.target.checked })}
              />
              <label htmlFor="notifyStudents" className="text-xs font-semibold opacity-70">
                Also send as Dashboard Notification to all students
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-30 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                Broadcast Now
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center animate-pulse opacity-40 italic">Fetching history...</div>
        ) : announcements.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[hsl(var(--muted)/0.3)] border-2 border-dashed border-[hsl(var(--border))] rounded-2xl opacity-40 italic">
            No announcements found.
          </div>
        ) : (
          announcements.map((a) => {
            const ethDate = dateToEthiopian(new Date(a.createdAt));
            return (
              <div key={a.id} className={`p-6 rounded-2xl border transition-all hover:shadow-md bg-[hsl(var(--card))] ${
                a.type === 'URGENT' ? 'border-red-500/20' :
                a.type === 'SCHEDULE' ? 'border-blue-500/20' :
                'border-[hsl(var(--border))]'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${
                    a.type === 'URGENT' ? 'bg-red-500/10 text-red-500' :
                    a.type === 'SCHEDULE' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    <Bell size={18} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-1.5">
                    <Clock size={12} /> {formatEthiopianDate(ethDate, 'short')}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{a.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed mb-4">{a.message}</p>
                <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    a.type === 'URGENT' ? 'bg-red-500/10 text-red-500' :
                    a.type === 'SCHEDULE' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-slate-500/10 text-slate-500'
                  }`}>
                    {a.type}
                  </span>
                  <button className="p-2 text-red-500/50 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
