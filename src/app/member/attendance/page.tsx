// /member/attendance/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Filter, Search, Calendar, ChevronRight } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

interface AttendanceRecord {
  id: string;
  eventId: string;
  event: {
    title: string;
    date: string;
  };
  attendanceType: {
    name: string;
    value: number;
  };
  note?: string;
}

export default function MemberAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      fetchAttendance(session.userId);
    }
  }, []);

  const fetchAttendance = async (userId: string) => {
    try {
      const res = await fetch(`/api/member/stats?memberId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        // The stats route returns 5 recent, but for history we might need a dedicated API
        // For now, I'll reuse the recent ones or create a new endpoint if needed.
        // Let's assume the stats route could return all if requested, or just fetch from a new endpoint.
        const allRes = await fetch(`/api/member/attendance?memberId=${userId}`);
        if (allRes.ok) {
          const allData = await allRes.json();
          setAttendances(allData);
        } else {
            // Fallback to recent from stats if dedicated endpoint doesn't exist yet
            setAttendances(data.recentAttendances);
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = attendances.filter(a =>
    a.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/member' },
          { label: 'Attendance History' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance History</h1>
          <p className="text-sm text-slate-400">View all your past participation records</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center bg-slate-800/20">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors w-full sm:w-auto">
            <Filter size={14} />
            Filter
          </button>
        </div>

        {/* Table/List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/40">
              <tr>
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Value</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    Loading your history...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{att.event.title}</div>
                      {att.note && <div className="text-[10px] text-slate-500 mt-0.5">{att.note}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-slate-500" />
                        {new Date(att.event.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{
                          background: att.attendanceType.value >= 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: att.attendanceType.value >= 1 ? '#10b981' : '#ef4444'
                        }}
                      >
                        {att.attendanceType.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {att.attendanceType.value.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-slate-500 group-hover:text-white transition-colors">
                         <ChevronRight size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
