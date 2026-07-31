// /member/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Bell, Clock, Check, Inbox } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

export default function MemberNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      fetchNotifications(session.userId);
    }
  }, []);

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`/api/member/stats?memberId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        // Stats route returns unread, but we might want all.
        // For now, I'll fetch all if we have a dedicated route.
        const allRes = await fetch(`/api/member/notifications?memberId=${userId}`);
        if (allRes.ok) {
          const allData = await allRes.json();
          setNotifications(allData);
        } else {
            setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/member/notifications/${id}/read`, { method: 'POST' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/member' },
          { label: 'Notifications' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-slate-400">Stay updated with your personal alerts</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
           <div className="p-12 text-center text-slate-500 animate-pulse">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
              <Inbox size={24} />
            </div>
            <p className="text-slate-400 text-sm font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 hover:bg-slate-800/30 transition-colors flex gap-4 ${!n.isRead ? 'bg-blue-500/5' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-full ${!n.isRead ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Bell size={16} />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{n.message}</p>
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="mt-2 text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1"
                    >
                      <Check size={12} />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
