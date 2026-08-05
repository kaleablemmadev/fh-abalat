"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Edit2, Bell, Loader2, Save, X } from "lucide-react";
import EthiopianDatePicker from "@/src/components/EthiopianDatePicker";
import { formatEthiopianDate, getEthiopianToday, ethiopianDateWordsToISO, ethiopianISOToGregorianDate, gregorianToEthiopianISO } from "@/src/lib/ethiopiancal";

interface CourseFreeDay {
  id: string;
  courseYearId: string;
  date: Date;
  reason: string;
  isAnnual: boolean;
  ethiopianYear?: number;
  ethiopianMonth?: number;
  ethiopianDay?: number;
  notificationsSent: boolean;
  notificationDate?: Date;
  courseYear: {
    course: { name: string };
    courseClass: { name: string; year: string };
  };
}

interface CourseFreeDayManagerProps {
  courseYearId: string;
  courseName: string;
  className: string;
}

export default function CourseFreeDayManager({
  courseYearId,
  courseName,
  className,
}: CourseFreeDayManagerProps) {
  const [freeDays, setFreeDays] = useState<CourseFreeDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const todayEthISO = ethiopianDateWordsToISO(getEthiopianToday());

  const initialFormState = {
    date: todayEthISO,
    reason: "",
    isAnnual: false,
  };

  const [formData, setFormData] = useState(initialFormState);

  const loadFreeDays = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/course/course-free-days?courseYearId=${courseYearId}`);
      if (res.ok) {
        const data = await res.json();
        setFreeDays(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFreeDays();
  }, [courseYearId]);

  const resetForm = () => {
    setFormData(initialFormState);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (freeDay: CourseFreeDay) => {
    setEditingId(freeDay.id);
    setIsAdding(true);
    setFormData({
      date: gregorianToEthiopianISO(new Date(freeDay.date)),
      reason: freeDay.reason,
      isAnnual: freeDay.isAnnual,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        courseYearId,
        date: ethiopianISOToGregorianDate(formData.date).toISOString(),
        reason: formData.reason,
        isAnnual: formData.isAnnual,
      };

      const url = editingId
        ? `/api/course/course-free-days/${editingId}`
        : "/api/course/course-free-days";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        loadFreeDays();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save course-free day");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save course-free day");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course-free day?")) {
      return;
    }

    try {
      const res = await fetch(`/api/course/course-free-days/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadFreeDays();
      } else {
        alert("Failed to delete course-free day");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete course-free day");
    }
  };

  const handleSendNotification = async (id: string) => {
    if (!confirm("Send notifications to all enrolled students about this course cancellation?")) {
      return;
    }

    setIsSendingNotification(true);
    try {
      const res = await fetch(`/api/course/course-free-days/${id}/send-notifications`, {
        method: "POST",
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Notifications sent to ${result.notificationsSent} students`);
        loadFreeDays();
      } else {
        alert("Failed to send notifications");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send notifications");
    } finally {
      setIsSendingNotification(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
          Course-Free Days
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(217,70%,32%)] text-white text-xs font-bold transition-all hover:bg-[hsl(217,70%,36%)]"
          >
            <Plus size={14} />
            Add Day
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-50">Date</label>
              <EthiopianDatePicker
                value={formData.date}
                onChange={(val) => setFormData({ ...formData, date: val })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-50">Reason</label>
              <input
                type="text"
                placeholder="e.g., Public holiday, Conference, etc."
                className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnnual"
                checked={formData.isAnnual}
                onChange={(e) => setFormData({ ...formData, isAnnual: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[hsl(217,70%,32%)]"
              />
              <label htmlFor="isAnnual" className="text-sm font-medium">
                Annual (repeats every year)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(217,70%,32%)] text-white rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </form>
      )}

      {freeDays.length === 0 && !isAdding && (
        <div className="py-8 text-center border border-dashed border-[hsl(var(--border))] rounded-xl">
          <Calendar className="mx-auto mb-2 text-[hsl(var(--muted-foreground))] opacity-20" size={32} />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No course-free days scheduled</p>
        </div>
      )}

      {freeDays.length > 0 && (
        <div className="space-y-2">
          {freeDays.map((freeDay) => (
            <div
              key={freeDay.id}
              className="flex items-center justify-between p-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold">{formatEthiopianDate(new Date(freeDay.date))}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{freeDay.reason}</p>
                  {freeDay.isAnnual && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded uppercase font-bold">
                      Annual
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {freeDay.notificationsSent ? (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <Bell size={12} /> Sent
                  </span>
                ) : (
                  <button
                    onClick={() => handleSendNotification(freeDay.id)}
                    disabled={isSendingNotification}
                    className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50"
                    title="Send notifications"
                  >
                    <Bell size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(freeDay)}
                  className="p-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-all"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(freeDay.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
