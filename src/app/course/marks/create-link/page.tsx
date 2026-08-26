// /course/marks/create-link/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link, Copy, Check, Calendar, BookOpen, Users, ArrowRight, Loader2 } from 'lucide-react';

interface CourseYear {
  id: string;
  course: {
    name: string;
    instructor: {
      fullName: string;
    };
  };
  courseClass: {
    name: string;
  };
  year: number;
  instructor?: {
    fullName: string;
  };
}

export default function CreateMarklistLinkPage() {
  const router = useRouter();
  const [courseYears, setCourseYears] = useState<CourseYear[]>([]);
  const [selectedCourseYearId, setSelectedCourseYearId] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<number>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCourseYears();
  }, []);

  const fetchCourseYears = async () => {
    try {
      const response = await fetch('/api/course/years');
      if (response.ok) {
        const data = await response.json();
        setCourseYears(data);
      }
    } catch (error) {
      console.error('Failed to fetch course years:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLink = async () => {
    if (!selectedCourseYearId) return;

    setIsCreating(true);
    try {
      const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch('/api/course/marks/shareable-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseYearId: selectedCourseYearId,
          expiresAt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedLink(data.shareableUrl);
      } else {
        throw new Error('Failed to create link');
      }
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Failed to create shareable link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedCourseYear = courseYears.find(cy => cy.id === selectedCourseYearId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="animate-spin" size={24} style={{ color: 'hsl(var(--muted-foreground))' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="border-b pb-5" style={{ borderColor: 'hsl(var(--border))' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
          Create Marklist Link
        </h1>
        <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Generate a shareable link for teachers to fill student marks
        </p>
      </div>

      {!generatedLink ? (
        <div className="space-y-6">
          {/* Course Selection */}
          <div
            className="rounded-lg p-6"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              Select Course
            </h2>
            
            {courseYears.length === 0 ? (
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No course years available. Please create course years first.
              </p>
            ) : (
              <div className="space-y-3">
                {courseYears.map((courseYear) => (
                  <button
                    key={courseYear.id}
                    onClick={() => setSelectedCourseYearId(courseYear.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedCourseYearId === courseYear.id
                        ? 'border-[hsl(217_70%_32%)] bg-[hsl(217_70%_32%/0.1)]'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border))]'
                    }`}
                    style={{
                      background: selectedCourseYearId === courseYear.id ? undefined : 'hsl(var(--card))',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={16} style={{ color: 'hsl(217 70% 32%)' }} />
                          <p className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                            {courseYear.course.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{courseYear.courseClass.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{courseYear.year}</span>
                          </div>
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Instructor: {courseYear.instructor?.fullName || courseYear.course.instructor.fullName}
                        </p>
                      </div>
                      {selectedCourseYearId === courseYear.id && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: 'hsl(217 70% 32%)', color: 'white' }}
                        >
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Expiration Settings */}
          <div
            className="rounded-lg p-6"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>
              Link Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                  Link expires in
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateLink}
            disabled={!selectedCourseYearId || isCreating}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all"
            style={{
              background: !selectedCourseYearId || isCreating ? 'hsl(200 70% 25%)' : 'hsl(200 70% 32%)',
              color: '#fff',
            }}
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating link...
              </>
            ) : (
              <>
                <Link size={16} />
                Generate Shareable Link
              </>
            )}
          </button>
        </div>
      ) : (
        /* Generated Link Display */
        <div
          className="rounded-lg p-6 space-y-6"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div className="flex items-center gap-2 text-emerald-500">
            <Check size={20} />
            <h2 className="text-lg font-semibold">Link Generated Successfully</h2>
          </div>

          {selectedCourseYear && (
            <div className="space-y-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <p><strong>Course:</strong> {selectedCourseYear.course.name}</p>
              <p><strong>Class:</strong> {selectedCourseYear.courseClass.name}</p>
              <p><strong>Year:</strong> {selectedCourseYear.year}</p>
              <p><strong>Instructor:</strong> {selectedCourseYear.instructor?.fullName || selectedCourseYear.course.instructor.fullName}</p>
              <p><strong>Expires:</strong> {new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Shareable Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                style={{
                  background: 'hsl(var(--muted))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all"
                style={{
                  background: 'hsl(200 70% 32%)',
                  color: '#fff',
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setGeneratedLink(null)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all border"
              style={{
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              Create Another Link
            </button>
            <button
              onClick={() => router.push('/course/marks')}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
              style={{
                background: 'hsl(200 70% 32%)',
                color: '#fff',
              }}
            >
              <ArrowRight size={14} />
              Go to Marks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
