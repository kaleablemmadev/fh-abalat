// /course/superadmin-settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowLeft, UserMinus, ShieldCheck, AlertTriangle } from 'lucide-react';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';

interface Admin {
  id: string;
  fullName: string | null;
  email: string | null;
}

export default function CourseSuperadminSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; type: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [transferToAdminId, setTransferToAdminId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);

  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));

    if (sessionCookie) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        setCurrentUser({
          id: session.userId,
          type: session.userType
        });
      } catch (e) {
        console.error('Failed to parse session');
      }
    }

    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/course/superadmin/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const handleEmailPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!newEmail && !newPassword) {
      setError('Please provide at least one field to update');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/course/superadmin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newEmail: newEmail || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update settings');
      }

      setSuccess('Settings updated successfully');
      setCurrentPassword('');
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!transferToAdminId) {
      setError('Please select an admin to transfer ownership to');
      return;
    }

    if (!confirm('Are you sure you want to transfer course superadmin ownership? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/course/superadmin/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAdminId: transferToAdminId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to transfer ownership');
      }

      setSuccess('Ownership transferred successfully. You will be logged out.');

      setTimeout(() => {
        document.cookie = 'mode_session=; path=/; max-age=0';
        router.push('/course/login');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer ownership');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to remove admin "${adminName}"?`)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/course/superadmin/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete admin');
      }

      setSuccess(`Admin "${adminName}" removed successfully`);
      fetchAdmins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'mode_session=; path=/; max-age=0';
    router.push('/course/login');
    router.refresh();
  };

  if (!currentUser || currentUser.type !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldCheck size={48} className="mx-auto text-[hsl(var(--muted-foreground))]" />
          <p className="text-lg font-medium text-[hsl(var(--muted-foreground))]">
            Access denied. Superadmin only.
          </p>
          <button
            onClick={() => router.push('/course')}
            className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
          >
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
      <Breadcrumb
        items={[
          { label: 'ዋና ገጽ', href: '/course' },
          { label: 'Superadmin Settings' },
        ]}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Course Superadmin Settings
          </h1>
          <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
            Manage system-wide configuration and administrative access for the Course module.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Update Email and Password */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                <Lock size={18} className="text-[hsl(var(--primary))]" />
                Security Settings
              </h2>
              <form onSubmit={handleEmailPasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Verify with current password"
                    className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[hsl(var(--border))]">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    New Email (optional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg text-xs font-medium bg-[hsl(0,40%,10%)] text-[hsl(0,55%,62%)] border border-[hsl(0,40%,22%)] animate-slide-in">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg text-xs font-medium bg-[hsl(160,40%,12%)] text-[hsl(160,60%,55%)] border border-[hsl(160,30%,20%)] animate-slide-in">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] active:scale-[0.98] shadow-md shadow-[hsl(var(--primary)/0.2)]"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Security Settings'}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            {/* Transfer Ownership */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4 shadow-sm">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Transfer Ownership
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Grant superadmin privileges to another active administrator. You will lose superadmin access immediately after transfer.
              </p>
              <form onSubmit={handleTransferOwnership} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    Select Target Admin
                  </label>
                  <select
                    value={transferToAdminId}
                    onChange={(e) => setTransferToAdminId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] transition-all appearance-none"
                    required
                  >
                    <option value="">Choose an administrator...</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.fullName || admin.email || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !transferToAdminId}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Transfer Course Superadmin'}
                </button>
              </form>
            </div>

            {/* Manage Admins */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4 shadow-sm">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <UserMinus size={18} className="text-red-500" />
                Active Administrators
              </h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {admins.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-6 border border-dashed border-[hsl(var(--border))] rounded-lg">
                    No other administrators found.
                  </p>
                ) : (
                  admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary)/0.3)] transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="text-sm font-bold text-[hsl(var(--foreground))] truncate">
                          {admin.fullName || 'Unnamed Admin'}
                        </p>
                        <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] truncate">
                          {admin.email || 'No email'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.fullName || 'Unknown')}
                        disabled={isLoading}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Remove Admin Access"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[hsl(var(--border))] flex justify-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all"
          >
            <ArrowLeft size={16} />
            Logout from Session
          </button>
        </div>
      </div>
    </div>
  );
}
