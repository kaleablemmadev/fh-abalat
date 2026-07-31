// /member/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bell,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface MemberStats {
  attendanceCount: number;
  recentAttendances: any[];
  eligibilitySummary: any[];
  notifications: any[];
}

export default function MemberDashboard() {
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      setUser(session);
      fetchStats(session.userId);
    }
  }, []);

  const fetchStats = async (userId: string) => {
    try {
      const res = await fetch(`/api/member/stats?memberId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-slate-400">Loading your profile...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.fullName}</h1>
          <p className="text-sm text-slate-400">Here's an overview of your participation</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2">
             <Calendar size={16} className="text-blue-500" />
             <span className="text-xs font-medium text-slate-300">
               {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
             </span>
           </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users size={20} className="text-blue-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.attendanceCount}</p>
          <p className="text-xs text-slate-500 mt-1">Total sessions attended</p>
        </div>

        {stats.eligibilitySummary.map((summary, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${summary.eligible ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {summary.eligible ? <CheckCircle size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-red-500" />}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Eligibility</span>
            </div>
            <p className={`text-2xl font-bold ${summary.eligible ? 'text-emerald-500' : 'text-red-500'}`}>
              {summary.eligible ? 'Eligible' : 'Ineligible'}
            </p>
            <p className="text-xs text-slate-500 mt-1 truncate">{summary.ruleName}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">

          {/* Eligibility Warnings */}
          {stats.eligibilitySummary.some(s => s.isNearLosing) && (
            <div className="bg-amber-900/20 border border-amber-800/50 p-4 rounded-xl flex gap-4 animate-pulse">
              <div className="p-2 bg-amber-500/20 rounded-full h-fit mt-0.5">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-500">Eligibility Warning</h3>
                <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                  You are near losing your eligibility status for upcoming events.
                  Please attend more sessions to maintain your active status.
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/member/attendance"
                    className="text-[10px] font-bold text-amber-500 hover:underline uppercase tracking-wider"
                  >
                    View History
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent Attendance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Recent Attendance</h3>
              <Link href="/member/attendance" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-800">
              {stats.recentAttendances.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm italic">No recent attendance records</div>
              ) : (
                stats.recentAttendances.map((att, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{att.event.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(att.event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{
                          background: att.attendanceType.value >= 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: att.attendanceType.value >= 1 ? '#10b981' : '#ef4444'
                        }}
                      >
                        {att.attendanceType.name}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-blue-500" />
                <h3 className="text-sm font-bold text-white">Notifications</h3>
              </div>
              {stats.notifications.length > 0 && (
                <span className="bg-blue-600 text-[9px] text-white font-bold px-1.5 py-0.5 rounded-full">
                  {stats.notifications.length}
                </span>
              )}
            </div>
            <div className="p-2 space-y-1">
              {stats.notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs italic">All caught up!</div>
              ) : (
                stats.notifications.map((n, idx) => (
                  <div key={idx} className="p-3 rounded-lg hover:bg-slate-800/50 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                      <span className="text-[9px] text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 bg-slate-800/50 border-t border-slate-800">
               <Link
                href="/member/notifications"
                className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
               >
                 Go to inbox <ChevronRight size={12} />
               </Link>
            </div>
          </div>

          {/* Quick Help */}
          <div className="bg-blue-600 rounded-xl p-5 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-sm font-bold mb-2">Need Help?</h3>
              <p className="text-[10px] text-blue-100 leading-relaxed mb-4">
                If you have questions about your attendance or eligibility, please contact your group administrator.
              </p>
              <button className="bg-white text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm group-hover:bg-blue-50 transition-colors">
                Contact Admin
              </button>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500 rounded-full opacity-20 group-hover:scale-110 transition-transform" />
            <div className="absolute -right-2 -top-2 w-12 h-12 bg-blue-400 rounded-full opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
