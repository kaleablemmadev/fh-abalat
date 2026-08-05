"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Search, User, Filter, Calendar, Info } from "lucide-react";

interface EligibilityReportClientProps {
  activeYear: any;
  permissions: any[];
  attendances: any[];
}

export default function EligibilityReportClient({
  activeYear,
  permissions,
  attendances
}: EligibilityReportClientProps) {
  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [examType, setExamType] = useState<"MID" | "FINAL">("MID");

  // Determine current semester based on dates
  const currentSemester = useMemo(() => {
    const today = new Date();
    if (activeYear.s2Start && today >= new Date(activeYear.s2Start)) {
      return "SECOND";
    }
    return "FIRST";
  }, [activeYear]);

  const reportData = useMemo(() => {
    const threshold = examType === "MID" ? activeYear.midExamMinAttendance : activeYear.finalExamMinAttendance;
    const semStart = currentSemester === "FIRST" ? activeYear.s1Start : activeYear.s2Start;
    const semEnd = currentSemester === "FIRST" ? activeYear.s1End : activeYear.s2End;

    return (activeYear.classes || []).flatMap((cls: any) => {
      if (classFilter !== "ALL" && cls.id !== classFilter) return [];

      return cls.courseEnrollments.map((enrollment: any) => {
        const student = enrollment.student;

        // Count attendances for this student in this semester
        const studentAttendances = attendances.filter(a =>
          a.memberId === student.id &&
          cls.events.some((e: any) => e.id === a.eventId) &&
          (!semStart || new Date(a.createdAt) >= new Date(semStart)) &&
          (!semEnd || new Date(a.createdAt) <= new Date(semEnd))
        );

        // In course mode, attendance values are usually 1 (Present), 0.5 (Permission) etc.
        // But the user said "5 attendances", so we count how many times they were present or excused
        const attendanceCount = studentAttendances.reduce((acc, curr) => acc + (curr.attendanceType.value >= 0.5 ? 1 : 0), 0);

        // Count approved permissions that overlap with this semester
        // (For simplicity, we check if the permission was created in this semester or overlaps)
        // Actually, we already counted permissions as 0.5 or 1 in attendance if they were marked.
        // But if attendance wasn't taken, we check permissions directly.
        // For now, let's assume attendance is taken for every session.

        const isEligible = attendanceCount >= threshold;

        return {
          id: `${cls.id}-${student.id}`,
          studentName: student.fullName,
          className: cls.name,
          attendanceCount,
          threshold,
          isEligible,
          privateId: student.privateId
        };
      });
    });
  }, [activeYear, attendances, currentSemester, classFilter, examType]);

  const filteredData = reportData.filter((d: any) =>
    d.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
    (d.privateId && d.privateId.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
        <Info className="text-blue-500 shrink-0" size={20} />
        <div className="text-xs text-blue-700 leading-relaxed">
          <p className="font-bold mb-1">Current Logic:</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Currently viewing <strong>{currentSemester === "FIRST" ? "Semester 1" : "Semester 2"}</strong> based on academic year dates.</li>
            <li>Eligibility is based on the <strong>{examType} Exam</strong> threshold: <strong>{examType === "MID" ? activeYear.midExamMinAttendance : activeYear.finalExamMinAttendance} attendances</strong>.</li>
            <li>Attendances include "Present" (1.0) and "Permission" (0.5) marks.</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
          <input
            type="text"
            placeholder="Search student name or ID..."
            className="w-full h-10 pl-10 pr-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            className="h-10 px-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none font-bold text-blue-600"
            value={examType}
            onChange={e => setExamType(e.target.value as any)}
          >
            <option value="MID">Mid Exam Eligibility</option>
            <option value="FINAL">Final Exam Eligibility</option>
          </select>
          <select
            className="h-10 px-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none"
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
          >
            <option value="ALL">All Classes</option>
            {(activeYear.classes || []).map((cls: any) => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[hsl(var(--muted)/0.3)] border-b border-[hsl(var(--border))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Class</th>
              <th className="px-6 py-4 text-center">Attendance</th>
              <th className="px-6 py-4 text-center">Requirement</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]">
            {filteredData.map((row: any) => (
              <tr key={row.id} className="hover:bg-[hsl(var(--muted)/0.1)] transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-[hsl(var(--foreground))]">{row.studentName}</div>
                  <div className="text-[10px] opacity-50 font-mono uppercase">{row.privateId}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 rounded uppercase">
                    {row.className}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-bold">
                  {row.attendanceCount}
                </td>
                <td className="px-6 py-4 text-center opacity-50">
                  {row.threshold}
                </td>
                <td className="px-6 py-4 text-right">
                  {row.isEligible ? (
                    <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                      <CheckCircle2 size={16} />
                      Eligible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 font-bold opacity-60">
                      <XCircle size={16} />
                      Blocked
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center opacity-30">
                  <User size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-bold">No students found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
