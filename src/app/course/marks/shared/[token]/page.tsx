// /course/marks/shared/[token]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Save, Users, Calculator, AlertCircle } from 'lucide-react';

interface Student {
  id: string;
  fullName: string | null;
}

interface CourseYearInfo {
  courseName: string;
  className: string;
  year: number;
  instructorName: string;
}

interface MarkData {
  studentId: string;
  midExamScore: string;
  assignmentScore: string;
  finalExamScore: string;
}

export default function SharedMarklistPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [courseInfo, setCourseInfo] = useState<CourseYearInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksState, setMarksState] = useState<Record<string, MarkData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [weights, setWeights] = useState({
    attendanceWeight: 10,
    midExamWeight: 25,
    assignmentWeight: 15,
    finalExamWeight: 50,
  });

  useEffect(() => {
    validateTokenAndLoadData();
  }, [token]);

  const validateTokenAndLoadData = async () => {
    try {
      // In a real implementation, you'd validate the token against a database
      // For now, we'll simulate this by checking if the token exists and is not expired
      // You'll need to implement proper token validation
      
      // Simulated validation - replace with actual API call
      const response = await fetch(`/api/course/marks/shared/${token}`);
      
      if (response.ok) {
        const data = await response.json();
        setCourseInfo(data.courseInfo);
        setStudents(data.students);
        setWeights(data.weights);
        
        // Initialize marks state
        const initialState: Record<string, MarkData> = {};
        data.students.forEach((student: Student) => {
          initialState[student.id] = {
            studentId: student.id,
            midExamScore: '',
            assignmentScore: '',
            finalExamScore: '',
          };
        });
        setMarksState(initialState);
        setIsValid(true);
      } else if (response.status === 410) {
        setIsExpired(true);
      } else {
        setIsValid(false);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setIsValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (
    studentId: string,
    field: 'midExamScore' | 'assignmentScore' | 'finalExamScore',
    value: string
  ) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const marksUpdate = Object.values(marksState).map((mark) => ({
        studentId: mark.studentId,
        midExamScore: mark.midExamScore ? parseFloat(mark.midExamScore) : undefined,
        assignmentScore: mark.assignmentScore ? parseFloat(mark.assignmentScore) : undefined,
        finalExamScore: mark.finalExamScore ? parseFloat(mark.finalExamScore) : undefined,
      }));

      const response = await fetch('/api/course/marks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseYearId: token, // In real implementation, this would come from the token data
          marks: marksUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save marks');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--muted-foreground))' }} />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <AlertCircle size={48} style={{ color: 'hsl(0 55% 55%)' }} />
        <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          Link Expired
        </h2>
        <p className="text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          This marklist link has expired. Please contact the administrator for a new link.
        </p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <AlertCircle size={48} style={{ color: 'hsl(0 55% 55%)' }} />
        <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          Invalid Link
        </h2>
        <p className="text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
          This marklist link is invalid or does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="border-b pb-5" style={{ borderColor: 'hsl(var(--border))' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          Student Marklist
        </h1>
        {courseInfo && (
          <div className="mt-2 space-y-1 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <p><strong>Course:</strong> {courseInfo.courseName}</p>
            <p><strong>Class:</strong> {courseInfo.className} · <strong>Year:</strong> {courseInfo.year}</p>
            <p><strong>Instructor:</strong> {courseInfo.instructorName}</p>
          </div>
        )}
      </div>

      {/* Weights Info */}
      <div
        className="rounded-lg p-3 text-[10px] flex flex-wrap gap-x-4 gap-y-1"
        style={{
          background: 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-1.5">
          <Calculator size={12} className="opacity-50" />
          <span className="font-bold uppercase tracking-wider opacity-50">Weights:</span>
        </div>
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Attendance: {weights.attendanceWeight}%</span>
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Mid Exam: {weights.midExamWeight}%</span>
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Assignment: {weights.assignmentWeight}%</span>
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Final Exam: {weights.finalExamWeight}%</span>
      </div>

      {/* Grading Grid */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  background: 'hsl(var(--muted))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <th
                  className="sticky left-0 px-3 py-2 text-left font-semibold z-10"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--foreground))',
                    minWidth: '150px',
                  }}
                >
                  Student
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: 'hsl(var(--foreground))', minWidth: '80px' }}
                >
                  Mid ({weights.midExamWeight})
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: 'hsl(var(--foreground))', minWidth: '80px' }}
                >
                  Assign ({weights.assignmentWeight})
                </th>
                <th
                  className="px-3 py-2 text-center font-semibold"
                  style={{ color: 'hsl(var(--foreground))', minWidth: '80px' }}
                >
                  Final ({weights.finalExamWeight})
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const current = marksState[student.id] || {
                  midExamScore: '',
                  assignmentScore: '',
                  finalExamScore: '',
                };

                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td
                      className="sticky left-0 px-3 py-2 z-10"
                      style={{
                        background: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                        minWidth: '150px',
                      }}
                    >
                      {student.fullName || 'Unnamed student'}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-16 h-7 rounded border px-2 text-xs text-center transition-all duration-150"
                        style={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                        type="number"
                        min="0"
                        max={weights.midExamWeight}
                        step="0.1"
                        value={current.midExamScore}
                        onChange={(e) => handleScoreChange(student.id, 'midExamScore', e.target.value)}
                        placeholder={`0-${weights.midExamWeight}`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-16 h-7 rounded border px-2 text-xs text-center transition-all duration-150"
                        style={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                        type="number"
                        min="0"
                        max={weights.assignmentWeight}
                        step="0.1"
                        value={current.assignmentScore}
                        onChange={(e) => handleScoreChange(student.id, 'assignmentScore', e.target.value)}
                        placeholder={`0-${weights.assignmentWeight}`}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        className="w-16 h-7 rounded border px-2 text-xs text-center transition-all duration-150"
                        style={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                        type="number"
                        min="0"
                        max={weights.finalExamWeight}
                        step="0.1"
                        value={current.finalExamScore}
                        onChange={(e) => handleScoreChange(student.id, 'finalExamScore', e.target.value)}
                        placeholder={`0-${weights.finalExamWeight}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div
        className="sticky bottom-4 rounded-lg p-3 flex items-center justify-between gap-3"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Users size={14} />
          <span>{students.length} students</span>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(160 65% 60%)' }}>
              <CheckCircle2 size={14} />
              Saved successfully
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(0 55% 60%)' }}>
              Failed to save
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold transition-colors duration-150"
            style={{
              background: isSaving ? 'hsl(200 70% 25%)' : 'hsl(200 70% 32%)',
              color: '#fff',
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={12} />
                Save Marks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
