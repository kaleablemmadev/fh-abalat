// /mezmur/audit-log/page.tsx
import prisma from '@/src/lib/prisma';
import { getAuditLogs } from '@/src/services/audit.service';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import { Clock, User, FileText } from 'lucide-react';

export default async function MezmurAuditLogPage() {
  const auditLogs = await getAuditLogs('MEZMUR');

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/mezmur' },
          { label: 'Audit Log' },
        ]}
      />

      <div className="space-y-4">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          Audit Log
        </h1>

        <div className="rounded border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No audit logs found
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="p-2 rounded-full"
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
                          <FileText size={16} />
                        ) : log.action === 'UPDATE' ? (
                          <Clock size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          {log.action}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                        {log.entityName || log.entityId}
                      </p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{log.performedBy.fullName || log.performedBy.email || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      {log.changes && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer hover:underline" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            View changes
                          </summary>
                          <pre className="mt-2 p-2 rounded text-xs overflow-x-auto" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                            {JSON.stringify(JSON.parse(log.changes), null, 2)}
                          </pre>
                        </details>
                      )}
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
