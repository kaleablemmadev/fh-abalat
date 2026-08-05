"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, User, BookOpen, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { courseClassTypeDisplayNames } from "../../../../constants/courseEnum";
import CourseFreeDayManager from "./CourseFreeDayManager";

interface CourseYear {
  id: string;
  courseId: string;
  courseClassId: string;
  year: string;
  semester: string;
  instructorId: string | null;
  course: {
    name: string;
  };
  courseClass: {
    name: string;
    year: string;
  };
}

interface Instructor {
  id: string;
  fullName: string;
}

interface FacultyManagementClientProps {
  initialOfferings: CourseYear[];
  instructors: Instructor[];
  academicYearId: string;
}

export default function FacultyManagementClient({
  initialOfferings,
  instructors,
  academicYearId
}: FacultyManagementClientProps) {
  const router = useRouter();
  const [offerings, setOfferings] = useState(initialOfferings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const handleInstructorChange = (courseYearId: string, instructorId: string) => {
    setOfferings(prev => prev.map(off =>
      off.id === courseYearId ? { ...off, instructorId } : off
    ));
  };

  const handleBulkInstructorChange = (className: string, instructorId: string) => {
    setOfferings(prev => prev.map(off =>
      off.courseClass.name === className ? { ...off, instructorId } : off
    ));
  };

  const handleSemesterBulkChange = (className: string, semester: string, instructorId: string) => {
    setOfferings(prev => prev.map(off =>
      off.courseClass.name === className && off.semester === semester ? { ...off, instructorId } : off
    ));
  };

  const handleClearSemester = (className: string, semester: string) => {
    setOfferings(prev => prev.map(off =>
      off.courseClass.name === className && off.semester === semester ? { ...off, instructorId: null } : off
    ));
  };

  const getInstructorName = (instructorId: string | null) => {
    if (!instructorId) return "No Instructor";
    const instructor = instructors.find(i => i.id === instructorId);
    return instructor?.fullName || "Unknown Instructor";
  };

  const handleCopyPreviousYear = async () => {
    // This would be a future enhancement to copy instructor assignments from previous academic year
    alert("This feature would copy instructor assignments from the previous academic year. Implementation pending.");
  };

  const handleClearClass = (className: string) => {
    setOfferings(prev => prev.map(off =>
      off.courseClass.name === className ? { ...off, instructorId: null } : off
    ));
  };

  const handleClearAll = () => {
    setOfferings(prev => prev.map(off => ({ ...off, instructorId: null })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Save each changed offering
      // For simplicity in a prototype, we can loop, but ideally use a bulk API
      for (const off of offerings) {
        const initial = initialOfferings.find(i => i.id === off.id);
        if (initial?.instructorId !== off.instructorId) {
          await fetch(`/api/course/course-years/${off.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instructorId: off.instructorId }),
          });
        }
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
      router.refresh();
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Group by class level
  const grouped = offerings.reduce((acc, off) => {
    const className = off.courseClass.name;
    if (!acc[className]) acc[className] = [];
    acc[className].push(off);
    return acc;
  }, {} as Record<string, CourseYear[]>);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg bg-[hsl(var(--muted))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-all">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Faculty Assignment</h1>
            <p className="text-sm opacity-50">Assign instructors to courses for the academic year.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyPreviousYear}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white font-bold text-sm border border-purple-500/20 transition-all"
          >
            Copy from Previous Year
          </button>
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white font-bold text-sm border border-red-500/20 transition-all"
          >
            Clear All
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/20 transition-all disabled:opacity-30"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Assignments
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {Object.entries(grouped).map(([className, classOfferings]) => (
          <div key={className} className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-blue-500">
                {courseClassTypeDisplayNames[className as keyof typeof courseClassTypeDisplayNames] || className}
              </h2>
              <div className="h-px flex-1 bg-[hsl(var(--border))]"></div>
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Assign All:</label>
                <select
                  className="h-8 px-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-xs font-bold focus:border-blue-500 transition-all outline-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkInstructorChange(className, e.target.value);
                      e.target.value = ""; // Reset after selection
                    }
                  }}
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.fullName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleClearClass(className)}
                  className="h-8 px-3 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white text-xs font-bold border border-red-500/20 transition-all"
                >
                  Clear Class
                </button>
              </div>
            </div>

            {/* Semester bulk assignment */}
            <div className="flex items-center gap-4 px-2 py-2 bg-[hsl(var(--muted)/0.3)] rounded-lg">
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Bulk by Semester:</span>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold">First Semester:</label>
                <select
                  className="h-7 px-2 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-xs font-bold focus:border-blue-500 transition-all outline-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSemesterBulkChange(className, "FIRST", e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Select</option>
                  {instructors.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.fullName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleClearSemester(className, "FIRST")}
                  className="h-7 px-2 rounded bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white text-[10px] font-bold border border-red-500/20 transition-all"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold">Second Semester:</label>
                <select
                  className="h-7 px-2 rounded bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-xs font-bold focus:border-blue-500 transition-all outline-none"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSemesterBulkChange(className, "SECOND", e.target.value);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Select</option>
                  {instructors.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.fullName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleClearSemester(className, "SECOND")}
                  className="h-7 px-2 rounded bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white text-[10px] font-bold border border-red-500/20 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classOfferings.map((off) => (
                <div key={off.id} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5 rounded-2xl shadow-sm hover:border-blue-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      <BookOpen size={18} />
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] opacity-60">
                      {off.semester} Sem
                    </span>
                  </div>

                  <h3 className="font-bold text-[hsl(var(--foreground))] mb-4 line-clamp-1">{off.course.name}</h3>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 px-1">Assigned Instructor</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
                      <select
                        className="w-full h-10 pl-9 pr-4 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-xs font-bold focus:border-blue-500 transition-all outline-none appearance-none"
                        value={off.instructorId || ""}
                        onChange={(e) => handleInstructorChange(off.id, e.target.value)}
                      >
                        <option value="">No Instructor Assigned</option>
                        {instructors.map((ins) => (
                          <option key={ins.id} value={ins.id}>
                            {ins.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedCourseId(expandedCourseId === off.id ? null : off.id)}
                    className="w-full py-2 px-3 rounded-lg bg-[hsl(var(--muted))] text-xs font-bold hover:bg-[hsl(var(--accent))] transition-all"
                  >
                    {expandedCourseId === off.id ? "Hide Course-Free Days" : "Manage Course-Free Days"}
                  </button>

                  {expandedCourseId === off.id && (
                    <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
                      <CourseFreeDayManager
                        courseYearId={off.id}
                        courseName={off.course.name}
                        className={off.courseClass.name}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {saveStatus === "success" && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-emerald-600 text-white font-bold shadow-lg animate-slide-up flex items-center gap-2">
            <CheckCircle2 size={20} /> Assignments updated successfully
        </div>
      )}
    </div>
  );
}
