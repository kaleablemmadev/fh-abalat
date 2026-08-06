"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Edit, Users, GraduationCap, Download, Loader2, Trash2, CheckSquare, Square } from "lucide-react";
import { courseClassTypeDisplayNames } from "../../constants/courseEnum";

interface Student {
  id: string;
  fullName: string | null;
  grandfatherName: string | null;
  gender: "MALE" | "FEMALE";
  age: number | null;
  phoneNumber: string | null;
  address: string | null;
  privateId: string | null;
  enrollments: {
    id: string;
    status: string;
    courseClass: {
      id: string;
      name: string;
      year: string;
    } | null;
  }[];
}

interface MemberListClientProps {
  students: Student[];
  courseClasses: { id: string; name: string; year: string }[];
}

const genderLabels: Record<string, string> = {
  MALE: "ወንድ",
  FEMALE: "ሴት",
};

export default function MemberListClient({ students, courseClasses }: MemberListClientProps) {
  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return students.filter((student) => {
      const activeEnrollment = student.enrollments?.[0];
      const className = activeEnrollment?.courseClass?.name ?? "";
      const classYear = activeEnrollment?.courseClass?.year ?? "";

      const normalizedFields = [
        student.fullName ?? "",
        student.phoneNumber ?? "",
        student.address ?? "",
        student.privateId ?? "",
        className,
        classYear,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesClass = classFilter
        ? activeEnrollment?.courseClass?.id === classFilter
        : true;

      return matchesSearch && matchesClass;
    });
  }, [students, classFilter, searchText]);

  const totals = useMemo(
    () => ({
      total: filteredStudents.length,
      active: filteredStudents.filter((s) => s.enrollments?.[0]?.status === "ACTIVE").length,
      pending: filteredStudents.filter((s) => s.enrollments?.[0]?.status === "PENDING").length,
    }),
    [filteredStudents]
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      window.location.href = '/api/course/members/export';
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleDeleteIndividual = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/course/members/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // In a real app, you'd want to refresh the data from the server
        window.location.reload();
      } else {
        alert("Failed to delete student");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert("No students selected");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} student(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/course/members/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to delete students");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete students");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div
        className="rounded-xl overflow-hidden bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
      >
        <div
          className="px-4 py-4 space-y-4 border-b border-[hsl(var(--border))]"
        >
          <div
            className="flex flex-wrap items-center gap-4 text-xs font-medium text-[hsl(var(--muted-foreground))]"
          >
            <div className="flex items-center gap-2 bg-[hsl(var(--accent)/0.5)] px-2.5 py-1 rounded-full border border-[hsl(var(--border))]">
              <GraduationCap size={14} className="text-[hsl(217,70%,32%)]" />
              <span className="text-[hsl(var(--foreground))] font-bold">
                {totals.total}
              </span>
              <span>ተማሪዎች</span>
            </div>

            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-[hsl(var(--foreground))]">{totals.active}</span> የሚከታተሉ
              </span>
              {selectedIds.size > 0 && (
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="font-bold">{selectedIds.size}</span> selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete Selected
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all disabled:opacity-50 border border-[hsl(var(--border))]"
              >
                {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                Export CSV
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]"
                size={16}
              />
              <input
                className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(217,70%,32%)/0.2] focus:border-[hsl(217,70%,32%)] transition-all"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="በስም፣ በኮድ ወይም በስልክ ቁጥር ፈልግ..."
              />
            </div>

            <div className="relative w-full md:w-64">
              <Users
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]"
                size={16}
              />
              <select
                className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] focus:outline-none appearance-none"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="">All Classes</option>
                {courseClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {courseClassTypeDisplayNames[c.name as keyof typeof courseClassTypeDisplayNames] || c.name} ({c.year})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSelectAll}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] border border-[hsl(var(--border))]"
              title={selectedIds.size === filteredStudents.length ? "Deselect All" : "Select All"}
            >
              {selectedIds.size === filteredStudents.length ? <CheckSquare size={18} /> : <Square size={18} />}
              {selectedIds.size === filteredStudents.length ? "Deselect All" : "Select All"}
            </button>

            <Link
              href="/course/members/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all bg-[hsl(217,70%,32%)] text-white hover:bg-[hsl(217,70%,36%)] active:scale-95 shadow-md shadow-[hsl(217,70%,32%)/0.2]"
            >
              <Plus size={18} />
              ዐዲስ ተማሪ
            </Link>
          </div>
        </div>

        <div className="p-4">
          {students.length === 0 ? (
            <div className="py-20 text-center">
              <Users size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-20" />
              <p className="text-lg font-semibold text-[hsl(var(--foreground))]">No students enrolled yet.</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Register your first student to get started.</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center">
              <Search size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-20" />
              <p className="text-lg font-semibold text-[hsl(var(--foreground))]">No students match your search.</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Try adjusting your filters.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const enrollment = student.enrollments?.[0];
                const courseClass = enrollment?.courseClass;

                return (
                  <li
                    key={student.id}
                    className={`group relative rounded-xl border bg-[hsl(var(--card))] p-5 transition-all duration-200 flex flex-col hover:shadow-lg ${
                      selectedIds.has(student.id) 
                        ? "border-[hsl(217,70%,32%)] bg-[hsl(217,70%,32%)/0.05]" 
                        : "border-[hsl(var(--border))] hover:border-[hsl(217,70%,32%)/0.4]"
                    }`}
                  >
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => handleSelect(student.id)}
                        className={`p-2 rounded-lg transition-all ${
                          selectedIds.has(student.id)
                            ? "bg-[hsl(217,70%,32%)] text-white"
                            : "bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(217,70%,32%)/0.1]"
                        }`}
                        title={selectedIds.has(student.id) ? "Deselect" : "Select"}
                      >
                        {selectedIds.has(student.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      <Link
                        href={`/course/members/${student.id}/edit`}
                        className="p-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(217,70%,32%)] hover:bg-[hsl(217,70%,32%)/0.1] shadow-sm transition-all"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDeleteIndividual(student.id)}
                        disabled={isDeleting}
                        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        title="Delete Student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-4 pr-8">
                      <h3
                        className="text-base font-bold text-[hsl(var(--foreground))] leading-tight truncate"
                      >
                        {student.fullName ?? "ስም አልተመዘገበም"}
                      </h3>
                      <p
                        className="text-xs mt-1 font-medium text-[hsl(var(--muted-foreground))]"
                      >
                        {genderLabels[student.gender] ?? student.gender} · {student.age ?? "?"} ዓመት
                      </p>
                    </div>

                    <div className="space-y-3 flex-1">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          <span>የኮርሰኛ መለያ ኮድ</span>
                          <span className="font-mono font-bold text-sky-500">{student.privateId ?? "None"}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          <span>የክፍል ደረጃ</span>
                          <span className="text-[hsl(var(--foreground))]">
                            {courseClass
                              ? `${courseClassTypeDisplayNames[courseClass.name as keyof typeof courseClassTypeDisplayNames] || courseClass.name} (${courseClass.year})`
                              : "Not enrolled"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          <span>ስልክ ቁጥር</span>
                          <span className="text-[hsl(var(--foreground))]">{student.phoneNumber ?? "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-auto border-t border-[hsl(var(--border))]">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            enrollment?.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {enrollment?.status ?? "NONE"}
                        </span>

                        <Link
                          href={`/course/members/${student.id}`}
                          className="text-xs font-bold text-[hsl(217,70%,32%)] hover:underline underline-offset-4 decoration-2 transition-all"
                        >
                          ዝርዝር →
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
