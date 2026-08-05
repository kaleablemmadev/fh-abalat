// /course/audit-log/page.tsx
import prisma from '@/src/lib/prisma';
import { getAuditLogs } from '@/src/services/audit.service';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import { Clock, User, FileText } from 'lucide-react';
import { formatEthiopianDate } from '@/src/lib/ethiopiancal';

export default async function CourseAuditLogPage() {
  const auditLogs = await getAuditLogs('COURSE');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <Breadcrumb
        items={[
          { label: 'ዋና ገጽ', href: '/course' },
          { label: 'ኦዲት መዝገብ' },
        ]}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Course Audit Log
          </h1>
          <p className="text-sm mt-1 text-[hsl(var(--muted-foreground))]">
            Detailed tracking of all administrative actions performed within the Course module.
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm">
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No audit logs recorded for this module yet.
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-5 hover:bg-[hsl(var(--accent)/0.3)] transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="p-2.5 rounded-xl transition-colors duration-150"
                        style={{
                          background: log.action === 'CREATE'
                            ? 'hsl(160 40% 12%)'
                            : log.action === 'UPDATE'
                            ? 'hsl(45 40% 12%)'
                            : 'hsl(0 40% 12%)',
                          color: log.action === 'CREATE'
                            ? 'hsl(160 60% 55%)'
                            : log.action === 'UPDATE'
                            ? 'hsl(45 60% 55%)'
                            : 'hsl(0 60% 55%)',
                        }}
                      >
                        {log.action === 'CREATE' ? (
                          <FileText size={18} />
                        ) : log.action === 'UPDATE' ? (
                          <Clock size={18} />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] uppercase tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] uppercase tracking-widest">
                          {log.entityType}
                        </span>
                        <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] ml-auto">
                          {formatEthiopianDate(new Date(log.createdAt))}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">
                        {log.entityName || log.entityId}
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
                          <User size={12} className="text-[hsl(var(--primary))]" />
                          <span className="text-[hsl(var(--foreground))]">
                            {log.performedBy.fullName || log.performedBy.email || 'System'}
                          </span>
                        </div>

                        {log.changes && (
                          <details className="group/details">
                            <summary className="text-[11px] font-bold cursor-pointer hover:text-[hsl(var(--primary))] text-[hsl(var(--muted-foreground))] transition-colors list-none">
                              View Raw Changes
                            </summary>
                            <div className="mt-3 p-3 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] overflow-x-auto">
                              <pre className="text-[10px] font-mono leading-relaxed text-[hsl(var(--foreground))]">
                                {JSON.stringify(JSON.parse(log.changes), null, 2)}
                              </pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
