// /members/components/MemberDetailClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Edit2, ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Breadcrumb from "@/src/components/navigation/Breadcrumb";

interface Member {
  id: string;
  fullName: string | null;
  christianName: string | null;
  gender: "MALE" | "FEMALE";
  age: number;
  memberType: "COURSE_STUDENT" | "REGULAR_MEMBER" | "YOUTH_STUDENT" | null;
  type: string;
  registerDate: string | null;
}

interface PermissionType {
  id: string;
  name: string;
  description: string | null;
  category: 'DURATION_BASED' | 'DAY_BASED';
  durationMonths: number | null;
  durationYears: number | null;
  appliesToChore: boolean;
  appliesToSunday: boolean;
  specificDays: number[];
  appliesToSundays: boolean;
}

interface Permission {
  id: string;
  permissionType: PermissionType;
  reason: string | null;
  ethiopianStartDate: string | null;
  status: string;
  createdAt: string;
}

const memberTypeLabels: Record<string, string> = {
  COURSE_STUDENT: "ኮርሰኛ አባል",
  REGULAR_MEMBER: "ወጣት አባል",
  YOUTH_STUDENT: "ማዕከላዊ አባል",
};

const memberTypeColors: Record<string, string> = {
  COURSE_STUDENT: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  REGULAR_MEMBER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  YOUTH_STUDENT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const genderLabels: Record<string, string> = {
  MALE: "ወንድ",
  FEMALE: "ሴት",
};

export default function MemberDetailClient({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(memberId ? null : "Member ID is missing.");
  const [isLoading, setIsLoading] = useState(!!memberId);
  
  // Permission states
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionTypes, setPermissionTypes] = useState<PermissionType[]>([]);
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [selectedPermissionTypeId, setSelectedPermissionTypeId] = useState('');
  const [permissionReason, setPermissionReason] = useState('');
  const [ethiopianStartDate, setEthiopianStartDate] = useState('');
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [deletingPermissionId, setDeletingPermissionId] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      return;
    }

    async function loadMember() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/members/${memberId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(
            errorData?.error || `Unable to load member (${res.status})`
          );
        }

        const data = (await res.json()) as Member;
        setMember(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load member");
        setMember(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadMember();
  }, [memberId]);

  useEffect(() => {
    if (!memberId) return;

    async function loadPermissions() {
      try {
        const res = await fetch(`/api/members/${memberId}/permissions`);
        if (res.ok) {
          const data = await res.json();
          setPermissions(data);
        }
      } catch (err) {
        console.error('Failed to load permissions:', err);
      }
    }

    loadPermissions();
  }, [memberId]);

  useEffect(() => {
    async function loadPermissionTypes() {
      try {
        const res = await fetch('/api/permission-types');
        if (res.ok) {
          const data = await res.json();
          setPermissionTypes(data);
        }
      } catch (err) {
        console.error('Failed to load permission types:', err);
      }
    }

    loadPermissionTypes();
  }, []);

  const handleAddPermission = async () => {
    if (!selectedPermissionTypeId) {
      alert('Please select a permission type');
      return;
    }

    setIsAddingPermission(true);
    try {
      const res = await fetch(`/api/members/${memberId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionTypeId: selectedPermissionTypeId,
          reason: permissionReason || null,
          ethiopianStartDate: ethiopianStartDate || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add permission');
      }

      const newPermission = await res.json();
      setPermissions([newPermission, ...permissions]);
      setShowAddPermission(false);
      setSelectedPermissionTypeId('');
      setPermissionReason('');
      setEthiopianStartDate('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add permission');
    } finally {
      setIsAddingPermission(false);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!confirm('Are you sure you want to remove this permission?')) {
      return;
    }

    setDeletingPermissionId(permissionId);
    try {
      const res = await fetch(`/api/members/${memberId}/permissions/${permissionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete permission');
      }

      setPermissions(permissions.filter(p => p.id !== permissionId));
    } catch (err) {
      alert('Failed to delete permission');
    } finally {
      setDeletingPermissionId(null);
    }
  };

  const getPermissionTypeDescription = (type: PermissionType) => {
    if (type.category === 'DURATION_BASED') {
      const parts = [];
      if (type.durationMonths) parts.push(`${type.durationMonths} months`);
      if (type.durationYears) parts.push(`${type.durationYears} years`);
      const appliesTo = [];
      if (type.appliesToChore) appliesTo.push('Chore');
      if (type.appliesToSunday) appliesTo.push('Sunday');
      return `Excused for ${parts.join(', ')} (${appliesTo.join(' & ')})`;
    } else {
      const parts = [];
      if (type.specificDays.length > 0) {
        parts.push(`Days: ${type.specificDays.join(', ')}`);
      }
      if (type.appliesToSundays) {
        parts.push('All Sundays');
      }
      return parts.join(', ') || 'No specific days configured';
    }
  };

  const badgeClass = member?.memberType
    ? memberTypeColors[member.memberType] ??
      "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
    : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  return (
    <div className="space-y-5 animate-fade-in max-w-lg">
      <Breadcrumb
        items={[
          { label: 'Members', href: '/members' },
          { label: member?.fullName || 'Profile' },
        ]}
      />

      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color: "hsl(160 55% 50%)" }}
        >
          የአባላት ዝርዝር ገጽ
        </p>
        <h1
          className="text-xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {member?.fullName ?? "Member profile"}
        </h1>
      </div>

      <section
        className="rounded-lg animate-slide-in overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {isLoading ? (
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div
                  className="h-4 w-1/2 rounded"
                  style={{ background: "hsl(var(--border))" }}
                />
                <div
                  className="h-3 w-1/4 rounded"
                  style={{ background: "hsl(var(--border))" }}
                />
              </div>
              <div
                className="h-5 w-20 rounded-full shrink-0"
                style={{ background: "hsl(var(--border))" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div
                className="h-14 rounded"
                style={{ background: "hsl(var(--border))" }}
              />
              <div
                className="h-14 rounded"
                style={{ background: "hsl(var(--border))" }}
              />
            </div>

            <div
              className="h-12 rounded"
              style={{ background: "hsl(var(--border))" }}
            />
          </div>
        ) : error ? (
          <div
            className="m-4 rounded p-5 text-center text-sm font-medium"
            style={{
              background: "hsl(0 40% 10%)",
              border: "1px dashed hsl(0 40% 22%)",
              color: "hsl(0 55% 60%)",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        ) : !member ? (
          <div
            className="m-4 rounded p-5 text-center text-sm"
            style={{
              border: "1px dashed hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Member not found.
          </div>
        ) : (
          <div>
            <div
              className="flex items-start justify-between gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid hsl(var(--border))" }}
            >
              <div className="space-y-0.5">
                <h2
                  className="text-base font-semibold leading-tight"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.fullName ?? "Unnamed member"}
                </h2>
                <p
                  className="text-xs"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {genderLabels[member.gender] ?? member.gender}
                </p>
              </div>

              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                  badgeClass
                }`}
              >
                {member.memberType
                  ? memberTypeLabels[member.memberType] ?? member.memberType
                  : "No type"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
              <div
                className="rounded p-3"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  ዕድሜ
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.age}
                </p>
              </div>

              <div
                className="rounded p-3"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  Member ID
                </p>
                <p
                  className="text-xs font-medium font-mono break-all leading-relaxed"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.id}
                </p>
              </div>

              <div
                className="rounded p-3"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  የክርስትና ስም
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.christianName ?? "-"}
                </p>
              </div>

              <div
                className="rounded p-3"
                style={{
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  የምዝገባ ቀን
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {member.registerDate ?? "-"}
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderTop: "1px solid hsl(var(--border))" }}
            >
              <Link
                href="/members"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-150"
                style={{ color: "hsl(var(--muted-foreground))" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "hsl(var(--foreground))")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "hsl(var(--muted-foreground))")
                }
              >
                <ArrowLeft size={12} />
                ወደኋላ ተመለስ
              </Link>

              <Link
                href={`/members/${memberId}/edit`}
                className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
                style={{
                  background: "hsl(160 70% 32%)",
                  color: "#fff",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "hsl(160 70% 38%)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "hsl(160 70% 32%)")
                }
              >
                <Edit2 size={12} />
                አስተካክል
              </Link>
            </div>
          </div>
        )}

        {/* Permissions Section */}
        {member && (
          <section
            className="rounded-lg animate-slide-in overflow-hidden"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center justify-between">
                <h2
                  className="text-base font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  Permissions
                </h2>
                <button
                  onClick={() => setShowAddPermission(!showAddPermission)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors duration-150"
                  style={{
                    background: 'hsl(160 40% 12%)',
                    color: 'hsl(160 60% 55%)',
                    border: '1px solid hsl(160 30% 20%)',
                  }}
                >
                  <Plus size={12} />
                  Add Permission
                </button>
              </div>
            </div>

            {showAddPermission && (
              <div className="p-4 space-y-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <div className="space-y-1">
                  <label className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    Permission Type
                  </label>
                  <select
                    value={selectedPermissionTypeId}
                    onChange={(e) => setSelectedPermissionTypeId(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    <option value="">Select a permission type...</option>
                    {permissionTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={permissionReason}
                    onChange={(e) => setPermissionReason(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                    placeholder="Reason for permission..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                    Start Date (Ethiopian, optional)
                  </label>
                  <input
                    type="text"
                    value={ethiopianStartDate}
                    onChange={(e) => setEthiopianStartDate(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                    placeholder="e.g., ጥቅም 5, 2017"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddPermission}
                    disabled={isAddingPermission}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-semibold transition-colors duration-150 disabled:opacity-50"
                    style={{
                      background: "hsl(160 70% 32%)",
                      color: "#fff",
                    }}
                  >
                    {isAddingPermission && <Loader2 size={12} className="animate-spin" />}
                    {isAddingPermission ? 'Adding...' : 'Add Permission'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPermission(false);
                      setSelectedPermissionTypeId('');
                      setPermissionReason('');
                      setEthiopianStartDate('');
                    }}
                    className="px-3 py-2 rounded text-xs font-medium transition-colors duration-150"
                    style={{
                      background: 'transparent',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="p-4">
              {permissions.length === 0 ? (
                <p className="text-sm text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                  No permissions assigned
                </p>
              ) : (
                <ul className="space-y-2">
                  {permissions.map((permission) => (
                    <li
                      key={permission.id}
                      className="flex items-start justify-between gap-3 p-3 rounded"
                      style={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                          {permission.permissionType.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {getPermissionTypeDescription(permission.permissionType)}
                        </p>
                        {permission.reason && (
                          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                            Reason: {permission.reason}
                          </p>
                        )}
                        {permission.ethiopianStartDate && (
                          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                            Start: {permission.ethiopianStartDate}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePermission(permission.id)}
                        disabled={deletingPermissionId === permission.id}
                        className="shrink-0 p-1 rounded hover:bg-[hsl(var(--accent))] transition-colors disabled:opacity-50"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {deletingPermissionId === permission.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}