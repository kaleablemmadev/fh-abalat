"use client";

import { useState } from "react";
import { Plus, CheckCircle2, XCircle, Clock, Search, User, Filter, Loader2, Calendar, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface MezmurPermissionListProps {
  initialPermissions: any[];
  permissionTypes: any[];
  members: any[];
}

export default function MezmurPermissionList({
  initialPermissions,
  permissionTypes,
  members
}: MezmurPermissionListProps) {
  const router = useRouter();
  const [permissions, setPermissions] = useState(initialPermissions);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [newPermission, setNewPermission] = useState({
    memberId: "",
    permissionTypeId: "",
    reason: "",
    ethiopianStartDate: "",
    ethiopianEndDate: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/mezmur/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPermission),
      });
      if (res.ok) {
        const created = await res.json();
        setPermissions([created, ...permissions]);
        setIsAdding(false);
        setNewPermission({
          memberId: "",
          permissionTypeId: "",
          reason: "",
          ethiopianStartDate: "",
          ethiopianEndDate: "",
        });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/mezmur/permissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPermissions(permissions.map(p => p.id === id ? { ...p, status } : p));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPermissions = permissions.filter(p => {
    const matchesSearch = p.member.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
                         p.permissionType.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
          <input
            type="text"
            placeholder="በአባልና በምክንያት ፈልግ..."
            className="w-full h-10 pl-10 pr-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            className="h-10 px-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(25_70%_45%)] text-white rounded-lg font-semibold text-sm whitespace-nowrap hover:bg-[hsl(25_70%_40%)]"
          >
            <Plus size={16} />
            ዐዲስ ፈቃድ
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg space-y-4 animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-50">አባል</label>
              <select
                className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                value={newPermission.memberId}
                onChange={e => setNewPermission({ ...newPermission, memberId: e.target.value })}
                required
              >
                <option value="">Select Member</option>
                {members.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-50">የፈቃድ ዐይነት</label>
              <select
                className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                value={newPermission.permissionTypeId}
                onChange={e => setNewPermission({ ...newPermission, permissionTypeId: e.target.value })}
                required
              >
                <option value="">ዐይነት ምረጥ</option>
                {permissionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-50">Ethiopian Start Date</label>
              <input
                type="text"
                placeholder="e.g., Tikimt 21, 2018"
                className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                value={newPermission.ethiopianStartDate}
                onChange={e => setNewPermission({ ...newPermission, ethiopianStartDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-50">Ethiopian End Date</label>
              <input
                type="text"
                placeholder="e.g., Tikimt 25, 2018"
                className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                value={newPermission.ethiopianEndDate}
                onChange={e => setNewPermission({ ...newPermission, ethiopianEndDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold uppercase opacity-50">Reason / Note</label>
              <textarea
                className="w-full p-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                rows={2}
                value={newPermission.reason}
                onChange={e => setNewPermission({ ...newPermission, reason: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))]"
            >
              ተመለስ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-[hsl(25_70%_45%)] text-white hover:bg-[hsl(25_70%_40%)] rounded-lg font-semibold text-sm"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Permission
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredPermissions.map((p) => (
          <div key={p.id} className="p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                p.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500" :
                p.status === "REJECTED" ? "bg-red-500/10 text-red-500" :
                "bg-amber-500/10 text-amber-500"
              }`}>
                {p.status === "APPROVED" ? <CheckCircle2 size={24} /> :
                 p.status === "REJECTED" ? <XCircle size={24} /> :
                 <Clock size={24} />}
              </div>
              <div>
                <h4 className="font-bold text-lg">{p.member.fullName}</h4>
                <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                  <Filter size={12} /> {p.permissionType.name}
                  <span className="mx-2 opacity-20">|</span>
                  <Calendar size={12} /> {p.ethiopianStartDate} - {p.ethiopianEndDate}
                </p>
                {p.reason && (
                  <p className="text-xs mt-1 italic opacity-70">"{p.reason}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {p.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(p.id, "REJECTED")}
                    className="px-4 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(p.id, "APPROVED")}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                  >
                    Approve
                  </button>
                </>
              )}
              {p.status !== "PENDING" && (
                <div className="text-[10px] uppercase font-bold tracking-widest opacity-50 px-3 py-1 bg-zinc-100 rounded-full dark:bg-zinc-800">
                  Reviewed by {p.reviewedBy?.fullName || "Admin"}
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredPermissions.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <Clock size={48} className="mx-auto mb-4" />
            <p className="text-lg font-bold">ምንም ፈቃድ አልተገኘም</p>
          </div>
        )}
      </div>
    </div>
  );
}
