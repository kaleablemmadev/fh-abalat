"use client";

import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function RecommendButton({ studentId, adminId }: { studentId: string, adminId: string }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/course/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, adminId })
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send recommendation");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
        <ShieldCheck size={16} />
        File Sent to Abalat
      </div>
    );
  }

  return (
    <button
      onClick={handleRecommend}
      disabled={loading}
      className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
      Send File to Abalat Admins
    </button>
  );
}
