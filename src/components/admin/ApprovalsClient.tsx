'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Registration {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  mode: string;
}

export default function ApprovalsClient({
  initialRegistrations,
  mode
}: {
  initialRegistrations: any[],
  mode: 'abalat' | 'course' | 'mezmur'
}) {
  const router = useRouter();
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        setUserId(session.userId);
      } catch (e) {
        console.error('Failed to parse session cookie');
      }
    }
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!userId) return;
    setProcessingId(id);

    try {
      const response = await fetch(`/api/${mode}/admin-approvals/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId: userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action}`);
      }

      setRegistrations(registrations.filter(r => r.id !== id));
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : `Failed to ${action} registration`);
    } finally {
      setProcessingId(null);
    }
  };

  if (registrations.length === 0) {
    return (
      <div className="p-8 text-center rounded border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
        ምንም የተመዘገቡ አድሚኖች የሉም
      </div>
    );
  }

  const primaryColor = mode === 'abalat' ? '160 70% 32%' : mode === 'course' ? '217 70% 32%' : '25 70% 32%';

  return (
    <div className="rounded border divide-y" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
      {registrations.map((registration) => (
        <div key={registration.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: 'hsl(var(--foreground))' }}>
                {registration.fullName}
              </h3>
              <p className="text-sm mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {registration.email}
              </p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <Clock size={12} />
                <span>የተመዘገበው በ{new Date(registration.createdAt).toLocaleString()} ነው</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(registration.id, 'approve')}
                disabled={processingId === registration.id}
                className="p-2 rounded transition-colors disabled:opacity-50"
                style={{ background: `hsl(${primaryColor} / 0.15)`, color: `hsl(${primaryColor})` }}
                title="Approve"
              >
                {processingId === registration.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button
                onClick={() => handleAction(registration.id, 'reject')}
                disabled={processingId === registration.id}
                className="p-2 rounded transition-colors disabled:opacity-50"
                style={{ background: 'hsl(0 40% 12%)', color: 'hsl(0 60% 55%)' }}
                title="Reject"
              >
                {processingId === registration.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
