"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, CheckCircle2, XCircle, Loader2, Save, X, Edit2, Users, Trash2, Clock, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EthiopianDatePicker from "@/src/components/EthiopianDatePicker";
import { formatEthiopianDate, getEthiopianToday, ethiopianDateWordsToISO, ethiopianISOToGregorianDate, gregorianToEthiopianISO } from "@/src/lib/ethiopiancal";
import TeachingHoursDisplay from "./TeachingHoursDisplay";

interface AcademicYear {
  id: string;
  year: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  s1Start: string | Date | null;
  s1End: string | Date | null;
  s2Start: string | Date | null;
  s2End: string | Date | null;
  s1MidExamDate: string | Date | null;
  s1FinalExamDate: string | Date | null;
  s2MidExamDate: string | Date | null;
  s2FinalExamDate: string | Date | null;
  midExamMinAttendance: number;
  finalExamMinAttendance: number;
  classes: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
}

interface AcademicYearListProps {
  initialYears: any[];
}

export default function AcademicYearList({ initialYears }: AcademicYearListProps) {
  const router = useRouter();
  const [years, setYears] = useState<AcademicYear[]>(initialYears);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const todayEthISO = ethiopianDateWordsToISO(getEthiopianToday());

  const initialFormState = {
    year: "",
    startDate: todayEthISO,
    endDate: todayEthISO,
    isActive: false,
    s1Start: todayEthISO,
    s1End: todayEthISO,
    s2Start: todayEthISO,
    s2End: todayEthISO,
    s1MidExamDate: todayEthISO,
    s1FinalExamDate: todayEthISO,
    s2MidExamDate: todayEthISO,
    s2FinalExamDate: todayEthISO,
    midExamMinAttendance: 5,
    finalExamMinAttendance: 5,
    includedClasses: ['KEDAMAY', 'KALEAY', 'SALSAY', 'RABEAY', 'KEREMT'],
  };

  const [formData, setFormData] = useState(initialFormState);

  const resetForm = () => {
    setFormData(initialFormState);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (year: AcademicYear) => {
    setEditingId(year.id);
    setIsAdding(true);
    setFormData({
      year: year.year,
      startDate: gregorianToEthiopianISO(new Date(year.startDate)),
      endDate: gregorianToEthiopianISO(new Date(year.endDate)),
      isActive: year.isActive,
      s1Start: year.s1Start ? gregorianToEthiopianISO(new Date(year.s1Start)) : todayEthISO,
      s1End: year.s1End ? gregorianToEthiopianISO(new Date(year.s1End)) : todayEthISO,
      s2Start: year.s2Start ? gregorianToEthiopianISO(new Date(year.s2Start)) : todayEthISO,
      s2End: year.s2End ? gregorianToEthiopianISO(new Date(year.s2End)) : todayEthISO,
      s1MidExamDate: year.s1MidExamDate ? gregorianToEthiopianISO(new Date(year.s1MidExamDate)) : todayEthISO,
      s1FinalExamDate: year.s1FinalExamDate ? gregorianToEthiopianISO(new Date(year.s1FinalExamDate)) : todayEthISO,
      s2MidExamDate: year.s2MidExamDate ? gregorianToEthiopianISO(new Date(year.s2MidExamDate)) : todayEthISO,
      s2FinalExamDate: year.s2FinalExamDate ? gregorianToEthiopianISO(new Date(year.s2FinalExamDate)) : todayEthISO,
      midExamMinAttendance: year.midExamMinAttendance,
      finalExamMinAttendance: year.finalExamMinAttendance,
      includedClasses: year.classes.map(c => c.name),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Convert Ethiopian ISO dates to Gregorian Dates for the API
      const payload = {
        ...formData,
        startDate: ethiopianISOToGregorianDate(formData.startDate).toISOString(),
        endDate: ethiopianISOToGregorianDate(formData.endDate).toISOString(),
        s1Start: ethiopianISOToGregorianDate(formData.s1Start).toISOString(),
        s1End: ethiopianISOToGregorianDate(formData.s1End).toISOString(),
        s2Start: ethiopianISOToGregorianDate(formData.s2Start).toISOString(),
        s2End: ethiopianISOToGregorianDate(formData.s2End).toISOString(),
        s1MidExamDate: ethiopianISOToGregorianDate(formData.s1MidExamDate).toISOString(),
        s1FinalExamDate: ethiopianISOToGregorianDate(formData.s1FinalExamDate).toISOString(),
        s2MidExamDate: ethiopianISOToGregorianDate(formData.s2MidExamDate).toISOString(),
        s2FinalExamDate: ethiopianISOToGregorianDate(formData.s2FinalExamDate).toISOString(),
      };

      const url = editingId ? `/api/course/academic-years/${editingId}` : "/api/course/academic-years";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (editingId) {
          setYears(years.map(y => y.id === editingId ? result : (payload.isActive ? { ...y, isActive: false } : y)));
        } else {
          setYears([result, ...years.map(y => payload.isActive ? { ...y, isActive: false } : y)]);
        }
        resetForm();
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClass = async (yearId: string, classId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/course/course-classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setYears(years.map(y => {
          if (y.id === yearId) {
            return {
              ...y,
              classes: (y.classes || []).map(c => c.id === classId ? { ...c, isActive: !currentStatus } : c)
            };
          }
          return y;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (yearId: string) => {
    if (!confirm("Are you sure you want to delete this academic year? This will also delete all associated classes and course records. This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/course/academic-years/${yearId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setYears(years.filter(y => y.id !== yearId));
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete academic year");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete academic year");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(217,70%,32%)] text-white rounded-lg font-semibold text-sm transition-all active:scale-95"
          >
            <Plus size={16} />
            Add New Year
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-sm space-y-6 animate-slide-in">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">{editingId ? 'Edit' : 'General'} Term Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase opacity-50">Year Name</label>
                <input
                  type="text"
                  placeholder="e.g., 2027 E.C."
                  className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm"
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <EthiopianDatePicker
                  label="Overall Start"
                  value={formData.startDate}
                  onChange={val => setFormData({ ...formData, startDate: val })}
                  required
                />
              </div>
              <div className="space-y-1">
                <EthiopianDatePicker
                  label="Overall End"
                  value={formData.endDate}
                  onChange={val => setFormData({ ...formData, endDate: val })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-[hsl(var(--border))] pt-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500">1st Semester Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <EthiopianDatePicker label="S1 Start" value={formData.s1Start} onChange={val => setFormData({...formData, s1Start: val})} required />
                <EthiopianDatePicker label="S1 End" value={formData.s1End} onChange={val => setFormData({...formData, s1End: val})} required />
                <EthiopianDatePicker label="S1 Mid Exam" value={formData.s1MidExamDate} onChange={val => setFormData({...formData, s1MidExamDate: val})} required />
                <EthiopianDatePicker label="S1 Final Exam" value={formData.s1FinalExamDate} onChange={val => setFormData({...formData, s1FinalExamDate: val})} required />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500">2nd Semester Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <EthiopianDatePicker label="S2 Start" value={formData.s2Start} onChange={val => setFormData({...formData, s2Start: val})} required />
                <EthiopianDatePicker label="S2 End" value={formData.s2End} onChange={val => setFormData({...formData, s2End: val})} required />
                <EthiopianDatePicker label="S2 Mid Exam" value={formData.s2MidExamDate} onChange={val => setFormData({...formData, s2MidExamDate: val})} required />
                <EthiopianDatePicker label="S2 Final Exam" value={formData.s2FinalExamDate} onChange={val => setFormData({...formData, s2FinalExamDate: val})} required />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-[hsl(var(--border))] pt-6">
             <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">Classes to Initialize</h3>
             <p className="text-[10px] text-[hsl(var(--muted-foreground))] italic -mt-2 mb-4">
                Note: Kedamay and Keremt are the same level but scheduled at different times of the year.
             </p>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {/* Level 1 Group */}
                <div className="space-y-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <h4 className="text-[10px] font-black uppercase tracking-tighter text-blue-500">Level 1</h4>
                  <div className="space-y-2">
                    {['KEDAMAY', 'KEREMT'].map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.includedClasses.includes(type)}
                          onChange={(e) => {
                            const newClasses = e.target.checked
                              ? [...formData.includedClasses, type]
                              : formData.includedClasses.filter(c => c !== type);
                            setFormData({ ...formData, includedClasses: newClasses });
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs font-medium group-hover:text-blue-600 transition-colors">
                          {type === 'KEDAMAY' ? 'Kedamay' : 'Keremt'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Level 2 Group */}
                <div className="space-y-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <h4 className="text-[10px] font-black uppercase tracking-tighter text-emerald-500">Level 2</h4>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.includedClasses.includes('KALEAY')}
                      onChange={(e) => {
                        const newClasses = e.target.checked
                          ? [...formData.includedClasses, 'KALEAY']
                          : formData.includedClasses.filter(c => c !== 'KALEAY');
                        setFormData({ ...formData, includedClasses: newClasses });
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600"
                    />
                    <span className="text-xs font-medium group-hover:text-emerald-600 transition-colors">Kale'ay</span>
                  </label>
                </div>

                {/* Level 3 Group */}
                <div className="space-y-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                  <h4 className="text-[10px] font-black uppercase tracking-tighter text-purple-500">Level 3</h4>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.includedClasses.includes('SALSAY')}
                      onChange={(e) => {
                        const newClasses = e.target.checked
                          ? [...formData.includedClasses, 'SALSAY']
                          : formData.includedClasses.filter(c => c !== 'SALSAY');
                        setFormData({ ...formData, includedClasses: newClasses });
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600"
                    />
                    <span className="text-xs font-medium group-hover:text-purple-600 transition-colors">Salsay</span>
                  </label>
                </div>

                {/* Level 4 Group */}
                <div className="space-y-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <h4 className="text-[10px] font-black uppercase tracking-tighter text-orange-500">Level 4</h4>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.includedClasses.includes('RABEAY')}
                      onChange={(e) => {
                        const newClasses = e.target.checked
                          ? [...formData.includedClasses, 'RABEAY']
                          : formData.includedClasses.filter(c => c !== 'RABEAY');
                        setFormData({ ...formData, includedClasses: newClasses });
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-orange-600"
                    />
                    <span className="text-xs font-medium group-hover:text-orange-600 transition-colors">Rabe'ay</span>
                  </label>
                </div>
             </div>
          </div>

          <div className="space-y-4 border-t border-[hsl(var(--border))] pt-6">
             <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">Eligibility Rules (Min Attendance)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase opacity-50">Mid-Exam Threshold</label>
                  <input type="number" min="0" className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm" value={formData.midExamMinAttendance} onChange={e => setFormData({...formData, midExamMinAttendance: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase opacity-50">Final-Exam Threshold</label>
                  <input type="number" min="0" className="w-full h-10 px-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-sm" value={formData.finalExamMinAttendance} onChange={e => setFormData({...formData, finalExamMinAttendance: parseInt(e.target.value) || 0})} />
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[hsl(217,70%,32%)]"
            />
            <label htmlFor="isActive" className="text-sm font-medium">Set as current active year</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-[hsl(217,70%,32%)] text-white rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingId ? 'Update Year Settings' : 'Initialize Year & Classes'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {years.map((year) => (
          <div
            key={year.id}
            className={`p-6 bg-[hsl(var(--card))] border rounded-xl transition-all ${
              year.isActive ? "border-[hsl(217,70%,32%)] shadow-md" : "border-[hsl(var(--border))]"
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${year.isActive ? "bg-[hsl(217,70%,32%)/0.1] text-[hsl(217,70%,32%)]" : "bg-zinc-100 text-zinc-400"}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {year.year}
                    {year.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded uppercase font-bold tracking-wider">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatEthiopianDate(new Date(year.startDate))} - {formatEthiopianDate(new Date(year.endDate))}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleEdit(year)}
                  className="p-2 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] transition-all"
                  title="Edit Year Settings"
                >
                  <Edit2 size={16} />
                </button>
                {!year.isActive && (
                  <button
                    onClick={() => handleDelete(year.id)}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    title="Delete Year"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <Link
                  href={`/course/academic-years/${year.id}/faculty`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all text-[10px] font-black uppercase"
                  title="Manage Year Faculty"
                >
                  <Users size={14} />
                  Manage Faculty
                </Link>
                <Link
                  href={`/course/academic-years/${year.id}/instructor-attendance`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white transition-all text-[10px] font-black uppercase"
                  title="Instructor Attendance"
                >
                  <Clock size={14} />
                  Instructor Attendance
                </Link>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase opacity-30">S1 Mid Threshold</p>
                  <p className="text-sm font-bold">{year.midExamMinAttendance}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase opacity-30">S1 Final Threshold</p>
                  <p className="text-sm font-bold">{year.finalExamMinAttendance}</p>
                </div>
              </div>
            </div>

            {year.s1MidExamDate && (
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold uppercase opacity-50">S1 Mid Exam</p>
                  <p className="text-[10px] font-bold">{year.s1MidExamDate ? formatEthiopianDate(new Date(year.s1MidExamDate)) : 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold uppercase opacity-50">S1 Final Exam</p>
                  <p className="text-[10px] font-bold">{year.s1FinalExamDate ? formatEthiopianDate(new Date(year.s1FinalExamDate)) : 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold uppercase opacity-50">S2 Mid Exam</p>
                  <p className="text-[10px] font-bold">{year.s2MidExamDate ? formatEthiopianDate(new Date(year.s2MidExamDate)) : 'N/A'}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-bold uppercase opacity-50">S2 Final Exam</p>
                  <p className="text-[10px] font-bold">{year.s2FinalExamDate ? formatEthiopianDate(new Date(year.s2FinalExamDate)) : 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <TeachingHoursDisplay academicYearId={year.id} />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] block">
                Class Availability & Levels
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Level 1 Group */}
                <div className="space-y-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                   <p className="text-[8px] font-black text-blue-500 uppercase">Level 1</p>
                   <div className="flex flex-wrap gap-2">
                     {year.classes?.filter(c => ['KEDAMAY', 'KEREMT'].includes(c.name)).map(cls => (
                       <button
                         key={cls.id}
                         onClick={() => toggleClass(year.id, cls.id, cls.isActive)}
                         className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold transition-all active:scale-95 ${
                           cls.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-zinc-100 border-zinc-200 text-zinc-400 grayscale"
                         }`}
                       >
                         {cls.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                         {cls.name === 'KEDAMAY' ? 'Kedamay' : 'Keremt'}
                       </button>
                     ))}
                   </div>
                </div>

                {/* Level 2 Group */}
                <div className="space-y-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                   <p className="text-[8px] font-black text-emerald-500 uppercase">Level 2</p>
                   {year.classes?.filter(c => c.name === 'KALEAY').map(cls => (
                     <button
                       key={cls.id}
                       onClick={() => toggleClass(year.id, cls.id, cls.isActive)}
                       className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold transition-all active:scale-95 ${
                         cls.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-zinc-100 border-zinc-200 text-zinc-400 grayscale"
                       }`}
                     >
                       {cls.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                       {cls.name === 'KALEAY' ? "Kale'ay" : cls.name}
                     </button>
                   ))}
                </div>

                {/* Level 3 Group */}
                <div className="space-y-2 p-2 rounded-lg bg-purple-500/5 border border-purple-500/10">
                   <p className="text-[8px] font-black text-purple-500 uppercase">Level 3</p>
                   {year.classes?.filter(c => c.name === 'SALSAY').map(cls => (
                     <button
                       key={cls.id}
                       onClick={() => toggleClass(year.id, cls.id, cls.isActive)}
                       className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold transition-all active:scale-95 ${
                         cls.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-zinc-100 border-zinc-200 text-zinc-400 grayscale"
                       }`}
                     >
                       {cls.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                       {cls.name === 'SALSAY' ? "Salsay" : cls.name}
                     </button>
                   ))}
                </div>

                {/* Level 4 Group */}
                <div className="space-y-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                   <p className="text-[8px] font-black text-orange-500 uppercase">Level 4</p>
                   {year.classes?.filter(c => c.name === 'RABEAY').map(cls => (
                     <button
                       key={cls.id}
                       onClick={() => toggleClass(year.id, cls.id, cls.isActive)}
                       className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold transition-all active:scale-95 ${
                         cls.isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-zinc-100 border-zinc-200 text-zinc-400 grayscale"
                       }`}
                     >
                       {cls.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                       {cls.name === 'RABEAY' ? "Rabe'ay" : cls.name}
                     </button>
                   ))}
                </div>
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] italic mt-2">
                Turn off classes that aren't running this year. Courses assigned to these classes will be hidden.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
