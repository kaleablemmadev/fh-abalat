"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Trash2, AlertCircle } from "lucide-react";

interface CourseOfferingActionsProps {
  courseId: string;
  courseName: string;
  courseYears: any[];
}

export default function CourseOfferingActions({
  courseId,
  courseName,
  courseYears
}: CourseOfferingActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleGradingStatus = async (courseYearId: string, currentStatus: boolean) => {
    setLoadingId(courseYearId);
    setError(null);
    try {
      const res = await fetch(`/api/course/course-years/${courseYearId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGradingComplete: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err) {
      setError("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteCourse = async () => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This cannot be undone.`)) return;

    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/course/courses/${courseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete course");
      }
      router.push("/course/courses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            Manage Terms & Status
          </h2>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {courseYears.map((cy) => (
            <div key={cy.id} className="p-5 flex items-center justify-between hover:bg-[hsl(var(--muted)/0.1)] transition-colors">
              <div>
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">
                  {cy.courseClass.name} — {cy.year}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-tighter">
                  {cy.semester} Semester
                </p>
              </div>

              <button
                onClick={() => toggleGradingStatus(cy.id, cy.isGradingComplete)}
                disabled={loadingId === cy.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all ${
                  cy.isGradingComplete
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                {loadingId === cy.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : cy.isGradingComplete ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <Circle size={12} />
                )}
                {cy.isGradingComplete ? 'Grading Complete' : 'Grading In Progress'}
              </button>
            </div>
          ))}
          {courseYears.length === 0 && (
             <div className="p-10 text-center text-sm text-[hsl(var(--muted-foreground))] italic">
               No active terms for this course.
             </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
            <Trash2 size={16} /> Danger Zone
        </h3>
        <p className="text-xs text-red-500/70 leading-relaxed">
            Deleting this course will remove all associated records. This action is permanent.
            Courses with existing student marks cannot be deleted.
        </p>
        <button
          onClick={handleDeleteCourse}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-30"
        >
          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Permanently Delete Course
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
}
