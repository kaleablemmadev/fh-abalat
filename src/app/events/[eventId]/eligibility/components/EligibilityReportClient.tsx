// src/app/events/[eventId]/eligibility/components/EligibilityReportClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Download, 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  Settings,
  Loader2
} from 'lucide-react';

interface EligibilityResult {
  memberId: string;
  fullName: string | null;
  eligible: boolean;
  reasons: string[];
  scores: {
    choreScore: number;
    sundayScore: number;
    totalScore: number;
    requiredChore: number;
    requiredSunday: number;
    requiredTotal: number;
    lookbackMonths: number;
  };
}

interface Rule {
  id: string;
  name: string;
  description: string | null;
  criteria: {
    id: string;
    eventType: string;
    minAttendances: number;
    lookbackMonths: number;
    isTotalAttendance: boolean;
  }[];
}

interface EligibilityReportClientProps {
  eventId: string;
  initialReport: {
    eventId: string;
    eventTitle: string;
    eventDate: Date;
    totalMembers: number;
    eligibleMembers: EligibilityResult[];
    ineligibleMembers: EligibilityResult[];
    eligibilityRule: {
      name: string;
      description: string | null;
      criteria: {
        eventType: string;
        minAttendances: number;
        lookbackMonths: number;
        isTotalAttendance: boolean;
      }[];
    };
  };
  eventTitle: string;
  eventDate: Date;
  allRules: Rule[];
  selectedRuleId: string | null;
}

export default function EligibilityReportClient({
  eventId,
  initialReport,
  eventTitle,
  eventDate,
  allRules,
  selectedRuleId: initialSelectedRuleId,
}: EligibilityReportClientProps) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
  const [error, setError] = useState<string | null>(null);
  const [showIneligible, setShowIneligible] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(initialSelectedRuleId);
  const [isApplyingRule, setIsApplyingRule] = useState(false);

  // Update report when rule changes
  useEffect(() => {
    if (selectedRuleId) {
      fetchReport(selectedRuleId);
    }
  }, [selectedRuleId]);

  const fetchReport = async (ruleId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/eligibility?ruleId=${ruleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch eligibility report');
      }
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRuleChange = async (ruleId: string) => {
    setSelectedRuleId(ruleId);
    // Update URL with the selected rule
    const url = new URL(window.location.href);
    if (ruleId) {
      url.searchParams.set('ruleId', ruleId);
    } else {
      url.searchParams.delete('ruleId');
    }
    router.push(url.pathname + url.search);
  };

  const applyRuleToEvent = async () => {
    if (!selectedRuleId) return;
    
    setIsApplyingRule(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/eligibility-rule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eligibilityRuleId: selectedRuleId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply rule');
      }

      // Refresh the page to show the updated event
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply rule');
    } finally {
      setIsApplyingRule(false);
    }
  };

  const downloadReport = async () => {
    if (report.eligibleMembers.length === 0) {
      setError('No eligible members to export');
      return;
    }

    setIsDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/eligibility/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eligible-members-${eventTitle.replace(/\s+/g, '-').toLowerCase()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download');
    } finally {
      setIsDownloading(false);
    }
  };

  const eligibleCount = report.eligibleMembers.length;
  const ineligibleCount = report.ineligibleMembers.length;
  const percentage = report.totalMembers > 0 
    ? Math.round((eligibleCount / report.totalMembers) * 100) 
    : 0;

  const hasEligibilityRule = report.eligibilityRule.criteria.length > 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <ArrowLeft size={16} />
          Back to Event
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[hsl(var(--border))]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Eligibility Report
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {eventTitle} - {new Date(eventDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/events/${eventId}/attendance`}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors duration-150"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            View Attendance
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Rule Selector */}
      <div
        className="rounded-lg p-4"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(var(--foreground))' }}>
              Select Eligibility Rule
            </label>
            <select
              value={selectedRuleId || ''}
              onChange={(e) => handleRuleChange(e.target.value || '')}
              className="w-full rounded border px-3 py-2 text-sm"
              style={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <option value="">Select a rule...</option>
              {allRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={applyRuleToEvent}
            disabled={isApplyingRule || !selectedRuleId}
            className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 whitespace-nowrap"
            style={{
              background: 'hsl(160 70% 32%)',
              color: '#fff',
            }}
          >
            {isApplyingRule && <Loader2 size={14} className="animate-spin" />}
            {isApplyingRule ? 'Applying...' : 'Apply to Event'}
          </button>
        </div>

        {selectedRuleId && (
          <div className="mt-3">
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <span className="font-medium">Selected:</span> {allRules.find(r => r.id === selectedRuleId)?.name || 'Unknown'}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div
          className="rounded p-3 text-sm font-medium"
          style={{
            background: 'hsl(0 40% 10%)',
            border: '1px solid hsl(0 40% 22%)',
            color: 'hsl(0 55% 62%)',
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Loading report...
          </div>
        </div>
      ) : !hasEligibilityRule ? (
        <div
          className="rounded-lg p-8 text-center"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <Settings size={40} className="mx-auto mb-3 opacity-50" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
            No Eligibility Rule Selected
          </h2>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Please select an eligibility rule from the dropdown above to view the report.
          </p>
          {allRules.length === 0 && (
            <Link
              href="/eligibility-rules/new"
              className="inline-flex items-center gap-1 text-sm font-medium mt-4 transition-colors duration-150"
              style={{ color: 'hsl(160 60% 55%)' }}
            >
              Create your first rule →
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div
              className="rounded-lg p-3 sm:p-4"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Total Members
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>
                {report.totalMembers}
              </p>
            </div>

            <div
              className="rounded-lg p-3 sm:p-4"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Eligible
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'hsl(160 60% 55%)' }}>
                {eligibleCount}
              </p>
            </div>

            <div
              className="rounded-lg p-3 sm:p-4"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Ineligible
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'hsl(0 55% 55%)' }}>
                {ineligibleCount}
              </p>
            </div>

            <div
              className="rounded-lg p-3 sm:p-4"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Eligibility Rate
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: 'hsl(var(--foreground))' }}>
                {percentage}%
              </p>
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div
            className="rounded-lg p-4"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Eligibility Criteria
            </h3>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {report.eligibilityRule.description || 'Standard eligibility rules'}
            </p>
            <ul className="mt-2 space-y-1">
              {report.eligibilityRule.criteria.map((criterion, index) => (
                <li key={index} className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {criterion.isTotalAttendance ? (
                    <>Total: Minimum {criterion.minAttendances} attendances in the last {criterion.lookbackMonths} months</>
                  ) : (
                    <>{criterion.eventType.charAt(0).toUpperCase() + criterion.eventType.slice(1)}: 
                    Minimum {criterion.minAttendances} attendances in the last {criterion.lookbackMonths} months</>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Download Section */}
          {eligibleCount > 0 && (
            <div
              className="rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <div className="flex items-center gap-2">
                <FileText size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
                <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  Download Eligible Members List
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'pdf' | 'docx')}
                  className="rounded px-2 py-1 text-sm"
                  style={{
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </select>
                <button
                  onClick={downloadReport}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'hsl(160 70% 32%)',
                    color: '#fff',
                  }}
                >
                  <Download size={14} />
                  {isDownloading ? 'Downloading...' : `Download (${eligibleCount})`}
                </button>
              </div>
            </div>
          )}

          {/* Member Lists */}
          <div className="space-y-4">
            {/* Eligible Members */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} style={{ color: 'hsl(160 60% 55%)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Eligible Members ({eligibleCount})
                  </span>
                </div>
              </div>
              <div className="p-3 max-h-[300px] overflow-y-auto">
                {eligibleCount === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    No eligible members found
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {report.eligibleMembers.map((member) => (
                      <li
                        key={member.memberId}
                        className="flex items-center justify-between px-3 py-2 rounded text-sm hover:bg-[hsl(var(--accent))]"
                      >
                        <span style={{ color: 'hsl(var(--foreground))' }}>
                          {member.fullName || 'Unnamed'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            Score: {member.scores.totalScore}
                          </span>
                          <span className="text-xs" style={{ color: 'hsl(160 60% 55%)' }}>
                            ✓ Eligible
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Ineligible Members - Collapsible */}
            {ineligibleCount > 0 && (
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <button
                  onClick={() => setShowIneligible(!showIneligible)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <XCircle size={16} style={{ color: 'hsl(0 55% 55%)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      Ineligible Members ({ineligibleCount})
                    </span>
                  </div>
                  <ChevronRight 
                    size={16} 
                    className={`transition-transform ${showIneligible ? 'rotate-90' : ''}`}
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                </button>
                {showIneligible && (
                  <div className="p-3 max-h-[300px] overflow-y-auto">
                    <ul className="space-y-2">
                      {report.ineligibleMembers.map((member) => (
                        <li
                          key={member.memberId}
                          className="px-3 py-2 rounded text-sm hover:bg-[hsl(var(--accent))]"
                        >
                          <div className="flex items-center justify-between">
                            <span style={{ color: 'hsl(var(--foreground))' }}>
                              {member.fullName || 'Unnamed'}
                            </span>
                            <span className="text-xs" style={{ color: 'hsl(0 55% 55%)' }}>
                              ✗ Ineligible
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {member.scores.requiredChore > 0 && (
                              <span>Chore: {member.scores.choreScore}/{member.scores.requiredChore}</span>
                            )}
                            {member.scores.requiredSunday > 0 && (
                              <span>Sunday: {member.scores.sundayScore}/{member.scores.requiredSunday}</span>
                            )}
                            {member.scores.requiredTotal > 0 && (
                              <span>Total: {member.scores.totalScore}/{member.scores.requiredTotal}</span>
                            )}
                          </div>
                          {member.reasons.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {member.reasons.map((reason, idx) => (
                                <li key={idx} className="text-[10px]" style={{ color: 'hsl(0 55% 55%)' }}>
                                  • {reason}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}