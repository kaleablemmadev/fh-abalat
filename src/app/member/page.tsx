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
  ArrowRight,
  Shield,
  Music
} from 'lucide-react';
import Link from 'next/link';
import { ethMonthNames, dateToEthiopian, formatEthiopianDate, getEthiopianToday, ethiopianDateToDate } from '@/src/lib/ethiopiancal';

interface MemberStats {
  attendanceCount: number;
  recentAttendances: any[];
  closestEvents: {
    id: string;
    title: string;
    date: Date;
    mode: 'ABALAT' | 'MEZMUR';
    eligibilityRule: {
      name: string;
      description: string | null;
      criteria: {
        eventType: string;
        minAttendances: number;
        lookbackMonths: number;
        isTotalAttendance: boolean;
      }[];
    };
    eligibilityCheck: {
      eligible: boolean;
      reasons: string[];
      scores: {
        choreScore: number;
        sundayScore: number;
        mezmurScore: number;
        totalScore: number;
        requiredChore: number;
        requiredSunday: number;
        requiredMezmur: number;
        requiredTotal: number;
        lookbackMonths: number;
      };
    };
  }[];
  monthlyAttendanceSum: number;
  notifications: any[];
}

function getMonthNumber(monthName: string): number {
  for (const [key, value] of Object.entries(ethMonthNames)) {
    if (value === monthName) return Number(key);
  }
  return 1;
}

export default function MemberDashboard() {
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const todayEthWords = getEthiopianToday();
  const [selectedMonth, setSelectedMonth] = useState<number>(getMonthNumber(todayEthWords.month));
  const [selectedYear, setSelectedYear] = useState<number>(todayEthWords.year);
  const [ethToday, setEthToday] = useState(getEthiopianToday());


  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      setUser(session);
      fetchStats(session.userId);
    }
    setEthToday(getEthiopianToday());
  }, []);

  const fetchStats = async (userId: string) => {
    try {
      const res = await fetch(`/api/member/stats?memberId=${userId}&month=${selectedMonth}&year=${selectedYear}`);
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

  useEffect(() => {
    if (user) {
      fetchStats(user.userId);
    }
  }, [selectedMonth, selectedYear]);

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const getEligibilityWarning = (event: any) => {
    if (event.eligibilityCheck.eligible) return null;
    
    // Check if it's still possible to achieve minimum criteria
    const currentDate = new Date();
    const eventDate = new Date(event.date);
    const daysUntilEvent = Math.ceil((eventDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only show warning if there's still time to improve eligibility
    if (daysUntilEvent > 0) {
      const maxLookback = event.eligibilityRule.criteria.reduce((max: number, c: any) => 
        Math.max(max, c.lookbackMonths), 0);
      const remainingDays = maxLookback * 30 - daysUntilEvent;
      
      // If there are remaining days in the lookback period, show warning
      if (remainingDays > 0) {
        return {
          message: `ለዚህ በዓል አገልግሎት መስፈርቱን አላሟሉም። መስፈርቱን ለማሟላት አቴንዳንስ ላይ ${remainingDays} ቀናት ይቀራል።`,
          severity: 'warning'
        };
      }
    }
    
    return null;
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
          <h1 className="text-2xl font-bold text-white">{user?.fullName}</h1>
          <p className="text-sm text-slate-400">በፍሬ ሃይማኖት ውስጥ የተሳትፎዎ ዝርዝር ገለፃ</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2">
             <Calendar size={16} className="text-blue-500" />
             <span className="text-xs font-medium text-slate-300">
               {formatEthiopianDate(ethToday)}
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
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">አቴንዳንስ</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.attendanceCount}</p>
          <p className="text-xs text-slate-500 mt-1">አጠቃላይ ያለው አቴንዳንስ</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Calendar size={20} className="text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ወርኃዊ አቴንዳንስ ውጤት</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.monthlyAttendanceSum.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {ethMonthNames[selectedMonth]} {selectedYear}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm col-span-1 sm:col-span-2">
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield size={20} className="text-purple-500" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ወር ምረጥ</span>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value), selectedYear)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
            >
              {Object.entries(ethMonthNames).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => handleMonthChange(selectedMonth, parseInt(e.target.value))}
              className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white"
              min="2000"
              max="2100"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Events with Eligibility */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">መጪ በዓላትና መስፈርቶቻቸው</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {stats.closestEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm italic">ወደፊት የተመዘገቡ በዓላት የሉም</div>
              ) : (
                stats.closestEvents.map((event, idx) => {
                  const warning = getEligibilityWarning(event);
                  const eventEthDate = dateToEthiopian(new Date(event.date));
                  
                  return (
                    <div key={idx} className="p-5 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                event.mode === 'ABALAT' 
                                  ? 'bg-blue-500/10 text-blue-500' 
                                  : 'bg-orange-500/10 text-orange-500'
                              }`}
                            >
                              {event.mode}
                            </span>
                            <h4 className="text-sm font-medium text-white">{event.title}</h4>
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatEthiopianDate(eventEthDate)}
                          </p>
                        </div>
                        <div className={`p-2 rounded-full ${
                          event.eligibilityCheck.eligible 
                            ? 'bg-emerald-500/20' 
                            : 'bg-red-500/20'
                        }`}>
                          {event.eligibilityCheck.eligible ? (
                            <CheckCircle size={20} className="text-emerald-500" />
                          ) : (
                            <XCircle size={20} className="text-red-500" />
                          )}
                        </div>
                      </div>

                      {/* Eligibility Rule */}
                      <div className="mb-3 p-3 rounded-lg bg-slate-800/50">
                        <p className="text-xs font-semibold text-slate-300 mb-2">
                          Rule: {event.eligibilityRule.name}
                        </p>
                        {event.eligibilityRule.description && (
                          <p className="text-xs text-slate-500 mb-2">{event.eligibilityRule.description}</p>
                        )}
                        <div className="space-y-1">
                          {event.eligibilityRule.criteria.map((c, cIdx) => (
                            <div key={cIdx} className="text-xs text-slate-400">
                              • {c.eventType === 'chore' ? "የሠርክ" : "የእሑድ"}: {c.minAttendances} አቴንዳንሶች በ{c.lookbackMonths} ወራት
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fulfillment Details */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Required</p>
                          <p className="text-sm font-bold text-white">
                            {event.eligibilityCheck.scores.requiredTotal > 0 
                              ? event.eligibilityCheck.scores.requiredTotal 
                              : event.eligibilityCheck.scores.requiredChore || event.eligibilityCheck.scores.requiredSunday || event.eligibilityCheck.scores.requiredMezmur}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current</p>
                          <p className="text-sm font-bold text-white">
                            {event.eligibilityCheck.scores.totalScore.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      {/* Eligibility Warning */}
                      {warning && (
                        <div className={`p-3 rounded-lg mb-3 ${
                          warning.severity === 'warning' 
                            ? 'bg-amber-900/20 border border-amber-800/50' 
                            : 'bg-red-900/20 border border-red-800/50'
                        }`}>
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className={warning.severity === 'warning' ? 'text-amber-500' : 'text-red-500'} />
                            <p className={`text-xs ${warning.severity === 'warning' ? 'text-amber-200' : 'text-red-200'}`}>
                              {warning.message}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Eligibility Status */}
                      <div className={`p-3 rounded-lg ${
                        event.eligibilityCheck.eligible
                          ? 'bg-emerald-900/20 border border-emerald-800/50'
                          : 'bg-red-900/20 border border-red-800/50'
                      }`}>
                        <p className={`text-xs font-semibold ${
                          event.eligibilityCheck.eligible ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {event.eligibilityCheck.eligible ? '✓ Eligible' : '✗ Not Eligible'}
                        </p>
                        {!event.eligibilityCheck.eligible && event.eligibilityCheck.reasons.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {event.eligibilityCheck.reasons.map((reason, rIdx) => (
                              <p key={rIdx} className="text-xs text-slate-400">• {reason}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

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
                stats.recentAttendances.map((att, idx) => {
                  const attEthDate = dateToEthiopian(new Date(att.event.date));
                  return (
                  <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{att.event.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {formatEthiopianDate(attEthDate, 'short')}
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
                  );
                })
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
                stats.notifications.map((n, idx) => {
                  const notifEthDate = dateToEthiopian(new Date(n.createdAt));
                  return (
                  <div key={idx} className="p-3 rounded-lg hover:bg-slate-800/50 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-medium text-slate-200 line-clamp-2">{n.title}</p>
                      <span className="text-[10px] text-slate-500">
                        {formatEthiopianDate(notifEthDate, 'short')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{n.message}</p>
                  </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/member/attendance"
                className="block text-center w-full py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                View Attendance History
              </Link>
              <Link
                href="/member/permissions"
                className="block text-center w-full py-2 px-4 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                My Permissions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
