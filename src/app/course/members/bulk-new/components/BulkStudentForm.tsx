"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, UserPlus, ArrowLeft, Upload, Download, FileSpreadsheet, FileText } from "lucide-react";
import { courseClassTypeDisplayNames } from "../../../constants/courseEnum";
import { parseExcelFile, downloadExcelTemplate, ParsedStudent } from "@/src/lib/excel-parser";

const fieldBase = {
  className: "h-10 w-full rounded-lg border px-4 text-sm transition-all outline-none focus:border-blue-500",
  style: {
    background: "hsl(var(--background))",
    borderColor: "hsl(var(--border))",
    color: "hsl(var(--foreground))",
  },
};

interface StudentRow {
  fullName: string;
  grandfatherName: string;
  phoneNumber: string;
  address: string;
  age: string;
  gender: "MALE" | "FEMALE";
  courseClassId: string;
  errors?: string[];
  source: 'manual' | 'excel';
}

interface BulkStudentFormProps {
  academicYears: any[];
  courseClasses: any[];
}

export default function BulkStudentForm({ academicYears, courseClasses }: BulkStudentFormProps) {
  const router = useRouter();
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>("");
  const [students, setStudents] = useState<StudentRow[]>([
    { fullName: "", grandfatherName: "", phoneNumber: "", address: "", age: "", gender: "MALE", courseClassId: "", source: 'manual' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [createdStudents, setCreatedStudents] = useState<{ fullName: string; studentId: string }[]>([]);

  const filteredClasses = selectedAcademicYearId
    ? courseClasses.filter((cc) => cc.academicYearId === selectedAcademicYearId)
    : courseClasses;

  const addStudentRow = () => {
    setStudents([
      ...students,
      { fullName: "", grandfatherName: "", phoneNumber: "", address: "", age: "", gender: "MALE", courseClassId: selectedAcademicYearId ? filteredClasses[0]?.id || "" : "", source: 'manual' },
    ]);
  };

  const removeStudentRow = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const updateStudentRow = (index: number, field: keyof StudentRow, value: string) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    setStudents(updated);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setError(null);

    try {
      const parsedStudents = await parseExcelFile(file);
      
      // Map parsed students to StudentRow format
      const mappedStudents: StudentRow[] = parsedStudents.map((parsed) => {
        // Find matching course class
        const matchingClass = filteredClasses.find((cc) => cc.name === parsed.classType);
        
        return {
          fullName: parsed.fullName,
          grandfatherName: parsed.grandfatherName,
          gender: parsed.gender,
          age: String(parsed.age),
          phoneNumber: parsed.phoneNumber,
          address: "",
          courseClassId: matchingClass?.id || "",
          errors: parsed.errors,
          source: 'excel',
        };
      });

      // Replace existing students with imported ones
      setStudents(mappedStudents.length > 0 ? mappedStudents : [
        { fullName: "", grandfatherName: "", phoneNumber: "", address: "", age: "", gender: "MALE", courseClassId: "", source: 'manual' },
      ]);
      
      if (mappedStudents.length > 0) {
        const errorCount = mappedStudents.filter(s => s.errors && s.errors.length > 0).length;
        if (errorCount > 0) {
          setError(`Imported ${mappedStudents.length} students. ${errorCount} have errors that need to be fixed.`);
        } else {
          setError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse Excel file");
    } finally {
      setIsParsingExcel(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const applyCourseClassToAll = (courseClassId: string) => {
    setStudents(students.map((s) => ({ ...s, courseClassId })));
  };

  const generateSampleData = () => {
    const sampleStudents: StudentRow[] = [
      { fullName: "Student 1", grandfatherName: "Grandfather 1", phoneNumber: "0911111111", address: "Addis Ababa", age: "20", gender: "MALE", courseClassId: filteredClasses[0]?.id || "", source: 'manual' },
      { fullName: "Student 2", grandfatherName: "Grandfather 2", phoneNumber: "0911222222", address: "Addis Ababa", age: "21", gender: "FEMALE", courseClassId: filteredClasses[0]?.id || "", source: 'manual' },
      { fullName: "Student 3", grandfatherName: "Grandfather 3", phoneNumber: "0911333333", address: "Addis Ababa", age: "22", gender: "MALE", courseClassId: filteredClasses[0]?.id || "", source: 'manual' },
    ];
    setStudents(sampleStudents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validStudents = students.filter(
      (s) => s.fullName && s.age && s.courseClassId && (!s.errors || s.errors.length === 0)
    );

    if (validStudents.length === 0) {
      setError("Please fill in at least one student with required fields and no errors");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessCount(0);

    try {
      const payload = validStudents.map((s) => ({
        fullName: s.fullName,
        grandfatherName: s.grandfatherName,
        phoneNumber: s.phoneNumber,
        address: s.address,
        age: Number(s.age),
        gender: s.gender,
        courseClassId: s.courseClassId,
      }));

      const res = await fetch("/api/course/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: payload }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create students");
      }

      const result = await res.json();
      setSuccessCount(result.created || validStudents.length);
      setCreatedStudents(result.students || []);
      
      // Generate PDF after successful creation
      if (result.students && result.students.length > 0) {
        setIsGeneratingPDF(true);
        try {
          // Get academic year and course class info
          const academicYearInfo = selectedAcademicYearId 
            ? academicYears.find(ay => ay.id === selectedAcademicYearId)
            : academicYears[0];
          
          const courseClassInfo = filteredClasses.find(cc => cc.id === validStudents[0].courseClassId);
          
          if (academicYearInfo && courseClassInfo) {
            const pdfRes = await fetch('/api/course/members/generate-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                academicYear: academicYearInfo.year,
                courseClass: courseClassInfo.name,
                students: result.students,
              }),
            });

            if (pdfRes.ok) {
              const pdfBlob = await pdfRes.blob();
              const pdfUrl = URL.createObjectURL(pdfBlob);
              const a = document.createElement('a');
              a.href = pdfUrl;
              a.download = `student_ids_${Date.now()}.pdf`;
              a.click();
              URL.revokeObjectURL(pdfUrl);
            }
          }
        } catch (pdfError) {
          console.error('Failed to generate PDF:', pdfError);
          // Don't fail the whole process if PDF generation fails
        } finally {
          setIsGeneratingPDF(false);
        }
      }
      
      setTimeout(() => {
        router.push("/course/members");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating students");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] opacity-60">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bulk Register Students</h1>
            <p className="text-sm opacity-50">Create multiple student records at once</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] flex items-center gap-2"
          >
            <Download size={16} />
            Download Template
          </button>
          <label className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] flex items-center gap-2 cursor-pointer">
            <FileSpreadsheet size={16} />
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
              disabled={isParsingExcel}
            />
          </label>
          <button
            type="button"
            onClick={generateSampleData}
            className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] flex items-center gap-2"
          >
            <Upload size={16} />
            Sample Data
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] p-6 space-y-4" style={{ background: "hsl(var(--card))" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-500">Academic Year</label>
            <select
              {...fieldBase}
              value={selectedAcademicYearId}
              onChange={(e) => {
                setSelectedAcademicYearId(e.target.value);
                setStudents(students.map((s) => ({ ...s, courseClassId: "" })));
              }}
              className={fieldBase.className + " border-blue-500/50 shadow-sm shadow-blue-500/10"}
            >
              <option value="">All Academic Years</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.year} {ay.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-blue-500">Apply Course Class to All</label>
            <select
              {...fieldBase}
              value={students[0]?.courseClassId || ""}
              onChange={(e) => applyCourseClassToAll(e.target.value)}
              className={fieldBase.className + " border-blue-500/50 shadow-sm shadow-blue-500/10"}
            >
              <option value="">Select class...</option>
              {filteredClasses.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {courseClassTypeDisplayNames[cc.name as keyof typeof courseClassTypeDisplayNames] || cc.name} ({cc.year})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Students ({students.length})
            </h3>
            <button
              type="button"
              onClick={addStudentRow}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all text-xs font-bold"
            >
              <Plus size={14} />
              Add Student
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isParsingExcel && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[hsl(var(--muted-foreground))]" />
                <span className="ml-2 text-sm text-[hsl(var(--muted-foreground))]">Parsing Excel file...</span>
              </div>
            )}
            
            {students.map((student, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-1 md:grid-cols-7 gap-2 p-3 rounded-lg border ${
                  student.errors && student.errors.length > 0 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-[hsl(var(--background))] border-[hsl(var(--border))]'
                }`}
              >
                {student.source === 'excel' && (
                  <div className="md:col-span-6 mb-2 flex items-center gap-2">
                    <FileSpreadsheet size={14} className="text-blue-500" />
                    <span className="text-xs text-blue-500">Imported from Excel</span>
                  </div>
                )}
                
                {student.errors && student.errors.length > 0 && (
                  <div className="md:col-span-6 mb-2">
                    <div className="text-xs text-red-500 font-medium">
                      Errors: {student.errors.join(', ')}
                    </div>
                  </div>
                )}
                
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-semibold uppercase opacity-50">Full Name *</label>
                  <input
                    {...fieldBase}
                    value={student.fullName}
                    onChange={(e) => updateStudentRow(index, "fullName", e.target.value)}
                    placeholder="Student name"
                    required
                    className={student.errors?.some(e => e.includes('name')) ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase opacity-50">Grandfather Name</label>
                  <input
                    {...fieldBase}
                    value={student.grandfatherName}
                    onChange={(e) => updateStudentRow(index, "grandfatherName", e.target.value)}
                    placeholder="Father's father name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase opacity-50">Gender</label>
                  <select
                    {...fieldBase}
                    value={student.gender}
                    onChange={(e) => updateStudentRow(index, "gender", e.target.value)}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase opacity-50">Age *</label>
                  <input
                    {...fieldBase}
                    type="number"
                    value={student.age}
                    onChange={(e) => updateStudentRow(index, "age", e.target.value)}
                    placeholder="20"
                    required
                    className={student.errors?.some(e => e.includes('age')) ? 'border-red-500' : ''}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase opacity-50">Phone</label>
                  <input
                    {...fieldBase}
                    value={student.phoneNumber}
                    onChange={(e) => updateStudentRow(index, "phoneNumber", e.target.value)}
                    placeholder="09..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase opacity-50">Class *</label>
                  <div className="flex gap-1">
                    <select
                      {...fieldBase}
                      value={student.courseClassId}
                      onChange={(e) => updateStudentRow(index, "courseClassId", e.target.value)}
                      className="flex-1 text-xs"
                      required
                    >
                      <option value="">Select...</option>
                      {filteredClasses.map((cc) => (
                        <option key={cc.id} value={cc.id}>
                          {cc.name}
                        </option>
                      ))}
                    </select>
                    {students.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStudentRow(index)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs border border-red-500/20">
          {error}
        </div>
      )}

      {successCount > 0 && (
        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs border border-emerald-500/20">
          Successfully created {successCount} students!
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm font-bold opacity-60 hover:opacity-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || isGeneratingPDF}
          className="px-8 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all disabled:opacity-30 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating...
            </>
          ) : isGeneratingPDF ? (
            <>
              <FileText size={16} className="animate-pulse" />
              Generating PDF...
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Register {students.length} Student{students.length !== 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
