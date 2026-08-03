"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Loader2, ChevronRight, Shield, ArrowLeft } from "lucide-react";

interface EligibilityRule {
  id: string;
  name: string;
  description: string | null;
  criteria: {
    id: string;
    eventType: string;
    minAttendances: number;
    lookbackMonths: number;
    isTotalAttendance: boolean;
  }[];
}

export default function MezmurEligibilityRulesPage() {
  const [rules, setRules] = useState<EligibilityRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mezmur/eligibility-rules");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRules(data);
    } catch (err) {
      setError("Error loading rules");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Mezmur eligibility rule?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/mezmur/eligibility-rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setRules(rules.filter(r => r.id !== id));
    } catch (err) {
      alert("Error deleting rule");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <Link href="/mezmur/eligibility" className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] opacity-60">
                <ArrowLeft size={18} />
            </Link>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">የመዝሙር ማሟላት መስፈርቶች</h1>
                <p className="text-sm opacity-50">የመዝሙር በዓላት ብቻ የሚጠቀሙ መስፈርቶች</p>
            </div>
        </div>

        <Link
          href="/mezmur/eligibility-rules/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-sm font-bold transition-all"
        >
          <Plus size={16} /> Create New Rule
        </Link>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        {isLoading ? (
          <div className="p-20 text-center opacity-30 flex flex-col items-center">
            <Loader2 size={40} className="animate-spin mb-4" />
            <p className="text-sm font-medium">Fetching rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-20 text-center opacity-30 flex flex-col items-center">
            <Shield size={48} className="mb-4" />
            <p className="text-sm font-medium">No eligibility rules defined yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 flex items-center justify-between group hover:bg-[hsl(var(--accent)/0.5)] transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-bold text-sm" style={{ color: "hsl(var(--foreground))" }}>{rule.name}</h4>
                  <p className="text-xs opacity-50 mt-1 line-clamp-1">{rule.description || "No description provided."}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {rule.criteria.map((c) => (
                      <span key={c.id} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-medium border border-[hsl(var(--border))]">
                        {c.isTotalAttendance ? "Total" : c.eventType}: {c.minAttendances} records in {c.lookbackMonths}m
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/mezmur/eligibility-rules/${rule.id}/edit`}
                    className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Edit size={14} className="opacity-50" />
                  </Link>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={deletingId === rule.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === rule.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
