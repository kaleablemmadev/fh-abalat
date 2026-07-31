// /abalat/superadmin-settings/page.tsx
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

export default function SuperadminSettingsPage() {
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
    // Get current user from session
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('mode_session='));
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie.split('=')[1]);
        setCurrentUser({
          id: session.userId,
          type: session.userType
        });
      } catch (e) {
        console.error('Failed to parse session');
      }
    }

    // Fetch admins
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/abalat/superadmin/admins');
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
      const response = await fetch('/api/abalat/superadmin/update', {
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

    if (!confirm('Are you sure you want to transfer superadmin ownership? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/abalat/superadmin/transfer', {
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
        router.push('/abalat/login');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer ownership');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to delete admin "${adminName}"? They will be notified of this action.`)) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/abalat/superadmin/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete admin');
      }

      setSuccess(`Admin "${adminName}" deleted successfully`);
      fetchAdmins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'mode_session=; path=/; max-age=0';
    router.push('/abalat/login');
    router.refresh();
  };

  if (!currentUser || currentUser.type !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldCheck size={48} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Access denied. Superadmin only.
          </p>
          <button
            onClick={() => router.push('/abalat')}
            className="px-4 py-2 rounded text-sm"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/abalat' },
          { label: 'Superadmin Settings' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Superadmin Settings
        </h1>

        {/* Update Email and Password */}
        <div className="rounded border p-6 space-y-6" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              Update Email and Password
            </h2>
            <form onSubmit={handleEmailPasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="newEmail" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  New Email (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  New Password (optional)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-2 rounded border text-sm"
                    style={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded text-sm" style={{ background: 'hsl(0 40% 12%)', color: 'hsl(0 55% 55%)' }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded text-sm" style={{ background: 'hsl(160 40% 12%)', color: 'hsl(160 60% 55%)' }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded text-sm font-medium transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'hsl(160 70% 32%)',
                  color: '#fff',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Settings'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Transfer Ownership */}
        <div className="rounded border p-6 space-y-6" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <AlertTriangle size={18} style={{ color: 'hsl(45 60% 55%)' }} />
              Transfer Superadmin Ownership
            </h2>
            <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Transfer superadmin privileges to another admin. This action cannot be undone.
            </p>
            <form onSubmit={handleTransferOwnership} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="transferTo" className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  Select Admin
                </label>
                <select
                  id="transferTo"
                  value={transferToAdminId}
                  onChange={(e) => setTransferToAdminId(e.target.value)}
                  className="w-full px-4 py-2 rounded border text-sm"
                  style={{
                    background: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                  required
                >
                  <option value="">Select an admin...</option>
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
                className="w-full py-2 px-4 rounded text-sm font-medium transition-colors duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'hsl(45 70% 32%)',
                  color: '#fff',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Transferring...
                  </>
                ) : (
                  'Transfer Ownership'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Manage Admins */}
        <div className="rounded border p-6 space-y-6" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <UserMinus size={18} />
              Manage Admins
            </h2>
            {admins.length === 0 ? (
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No admins found.
              </p>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 rounded border"
                    style={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                        {admin.fullName || 'Unknown'}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {admin.email || 'No email'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id, admin.fullName || 'Unknown')}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150 disabled:opacity-50 flex items-center gap-1"
                      style={{
                        background: 'hsl(0 70% 32%)',
                        color: '#fff',
                      }}
                    >
                      <UserMinus size={12} />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <ArrowLeft size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
