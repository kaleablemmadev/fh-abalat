// /course/courses/components/CourseListClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Edit, BookOpen, User, Download, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface Course {
  id: string;
  name: string;
  description: string | null;
  topics: string[];
  credits: number | null;
  isGiven: boolean;
  classTypes: string[];
  instructor: {
    id: string;
    fullName: string;
  };
  courseYears: Array<{
    id: string;
    courseClass: {
      id: string;
      name: string;
      year: string;
    };
  }>;
}

interface Instructor {
  id: string;
  fullName: string;
}

interface CourseListClientProps {
  courses: Course[];
  instructors: Instructor[];
}

export default function CourseListClient({ courses: initialCourses, instructors }: CourseListClientProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [searchText, setSearchText] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return courses.filter((course) => {
      const normalizedFields = [
        course.name,
        course.description || "",
        course.topics.join(" "),
        course.instructor.fullName,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalizedSearch
        ? normalizedFields.includes(normalizedSearch)
        : true;

      const matchesInstructor = instructorFilter
        ? course.instructor.id === instructorFilter
        : true;

      return matchesSearch && matchesInstructor;
    });
  }, [courses, instructorFilter, searchText]);

  const totals = useMemo(
    () => ({
      total: filteredCourses.length,
      given: filteredCourses.filter((c) => c.isGiven).length,
      notGiven: filteredCourses.filter((c) => !c.isGiven).length,
    }),
    [filteredCourses]
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      window.location.href = '/api/course/courses/export';
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will fail if the course is assigned to any academic years.`)) return;

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/course/courses/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== id));
      } else {
        alert(data.error || "Failed to delete course. It likely has active classes assigned to it.");
      }
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setIsDeleting(null);
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
              <BookOpen size={14} className="text-[hsl(217,70%,32%)]" />
              <span className="text-[hsl(var(--foreground))] font-bold">
                {totals.total}
              </span>
              <span>Courses</span>
            </div>

            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-[hsl(var(--foreground))]">{totals.given}</span> Given
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                <span className="font-bold text-[hsl(var(--foreground))]">{totals.notGiven}</span> Not Given
              </span>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-all disabled:opacity-50 border border-[hsl(var(--border))]"
            >
              {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Export CSV
            </button>
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
                placeholder="Search courses, topics, instructors..."
              />
            </div>

            <div className="relative w-full md:w-64">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]"
                size={16}
              />
              <select
                className="h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-10 pr-4 text-sm text-[hsl(var(--foreground))] focus:outline-none appearance-none"
                value={instructorFilter}
                onChange={(event) => setInstructorFilter(event.target.value)}
              >
                <option value="">All Instructors</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.fullName}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/course/courses/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all bg-[hsl(217,70%,32%)] text-white hover:bg-[hsl(217,70%,36%)] active:scale-95 shadow-md shadow-[hsl(217,70%,32%)/0.2]"
            >
              <Plus size={18} />
              New Course
            </Link>
          </div>
        </div>

        <div className="p-4">
          {courses.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-20" />
              <p className="text-lg font-semibold text-[hsl(var(--foreground))]">No courses available.</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Create your first course to get started.</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-20 text-center">
              <Search size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))] opacity-20" />
              <p className="text-lg font-semibold text-[hsl(var(--foreground))]">No courses match your search.</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Try adjusting your filters.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <li
                  key={course.id}
                  className="group relative rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-all duration-200 flex flex-col hover:border-[hsl(217,70%,32%)/0.4] hover:shadow-lg"
                >
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Link
                      href={`/course/courses/${course.id}/edit`}
                      className="p-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(217,70%,32%)] hover:bg-[hsl(217,70%,32%)/0.1] shadow-sm"
                    >
                      <Edit size={14} />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id, course.name)}
                      disabled={isDeleting === course.id}
                      className="p-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-500/10 shadow-sm disabled:opacity-50"
                    >
                      {isDeleting === course.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>

                  <div className="mb-4 pr-12">
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))] leading-tight truncate">
                      {course.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                      <User size={12} className="text-[hsl(217,70%,32%)]" />
                      <span>{course.instructor.fullName}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {course.classTypes.map((type) => (
                        <span key={type} className="text-[9px] px-1.5 py-0.5 bg-[hsl(217,70%,32%)/0.05] text-[hsl(217,70%,32%)/0.7] rounded border border-[hsl(217,70%,32%)/0.1] font-bold uppercase tracking-tighter">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    {course.description && (
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {course.topics.slice(0, 3).map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[10px] font-medium text-[hsl(var(--foreground))] border border-[hsl(var(--border))]"
                        >
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] flex items-center">
                          +{course.topics.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="pt-4 mt-auto border-t border-[hsl(var(--border))] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {course.credits && (
                          <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                            {course.credits} Credits
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            course.isGiven
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}
                        >
                          {course.isGiven ? "Active" : "Archived"}
                        </span>
                      </div>

                      <Link
                        href={`/course/courses/${course.id}`}
                        className="text-xs font-bold text-[hsl(217,70%,32%)] hover:underline underline-offset-4 decoration-2 transition-all"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
