// /abalat/permissions/page.tsx
import prisma from '@/src/lib/prisma';
import Breadcrumb from '@/src/components/navigation/Breadcrumb';
import { Calendar, Clock, CheckCircle, XCircle, User } from 'lucide-react';

interface PermissionWithDetails {
  id: string;
  ethiopianStartDate: string | null;
  ethiopianEndDate: string | null;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reason: string | null;
  member: {
    id: string;
    fullName: string | null;
    email: string | null;
    privateId: string | null;
  };
  permissionType: {
    id: string;
    name: string;
    description: string | null;
    durationMonths: number | null;
    durationYears: number | null;
    appliesToChore: boolean;
    appliesToSunday: boolean;
  };
}

function calculateDuration(ethiopianStartDate: string | null, ethiopianEndDate: string | null): string {
  if (!ethiopianStartDate || !ethiopianEndDate) {
    return 'N/A';
  }
  
  try {
    // Parse Ethiopian dates (format: "Month Day, Year" or similar)
    // For now, return the raw values
    return `${ethiopianStartDate} - ${ethiopianEndDate}`;
  } catch {
    return 'N/A';
  }
}

function isPermissionActive(ethiopianEndDate: string | null): boolean {
  if (!ethiopianEndDate) return false;
  
  // This is a simplified check - in production you'd need proper Ethiopian date comparison
  // For now, we'll consider it active if it doesn't have an end date or if the end date is in the future
  const today = new Date();
  // You'd need to convert Ethiopian date to Gregorian for proper comparison
  // For this implementation, we'll use a simple heuristic
  return true; // Placeholder - implement proper date comparison
}

export default async function PermissionsPage() {
  // Get permissions that are APPROVED
  const permissions = await prisma.permission.findMany({
    where: {
      status: 'APPROVED',
    },
    include: {
      member: {
        where: {
          type: 'MEMBER',
          NOT: { roles: { has: 'COURSE_STUDENT' } },
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          privateId: true,
        },
      },
      permissionType: {
        select: {
          id: true,
          name: true,
          description: true,
          durationMonths: true,
          durationYears: true,
          appliesToChore: true,
          appliesToSunday: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Filter permissions to show:
  // 1. Active permissions (no end date or end date >= today)
  // 2. Permissions that ended in the last 3 months
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const filteredPermissions = permissions.filter((permission) => {
    // For now, include all APPROVED permissions
    // In production, implement proper Ethiopian date filtering
    return true;
  });

  // Group permissions by status (active vs ended)
  const activePermissions = filteredPermissions.filter(p => 
    !p.ethiopianEndDate || isPermissionActive(p.ethiopianEndDate)
  );
  
  const endedPermissions = filteredPermissions.filter(p => 
    p.ethiopianEndDate && !isPermissionActive(p.ethiopianEndDate)
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/abalat' },
          { label: 'Permissions' },
        ]}
      />

      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
            Member Permissions
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            View all active and recently ended member permissions
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded border p-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ background: 'hsl(160 40% 12%)' }}>
                <CheckCircle size={20} style={{ color: 'hsl(160 60% 55%)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {activePermissions.length}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Active Permissions
                </p>
              </div>
            </div>
          </div>

          <div className="rounded border p-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ background: 'hsl(0 40% 12%)' }}>
                <XCircle size={20} style={{ color: 'hsl(0 60% 55%)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {endedPermissions.length}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Ended (Last 3 Months)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded border p-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ background: 'hsl(var(--muted))' }}>
                <User size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  {filteredPermissions.length}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Total Permissions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Permissions Table */}
        <div className="rounded border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <CheckCircle size={18} style={{ color: 'hsl(160 60% 55%)' }} />
              Active Permissions
            </h2>
          </div>
          
          {activePermissions.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No active permissions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Member
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Permission Type
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Duration
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Attendance Type
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Start Date
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activePermissions.map((permission) => (
                    <tr key={permission.id} className="border-b hover:bg-[hsl(var(--muted)/0.3)]" style={{ borderColor: 'hsl(var(--border))' }}>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            {permission.member.fullName || 'Unknown'}
                          </p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {permission.member.privateId || permission.member.email || 'No ID'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            {permission.permissionType.name}
                          </p>
                          {permission.permissionType.description && (
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {permission.permissionType.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          <Clock size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                          {calculateDuration(permission.ethiopianStartDate, permission.ethiopianEndDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {permission.permissionType.appliesToChore && (
                            <span className="px-2 py-1 rounded text-xs" style={{ background: 'hsl(200 40% 12%)', color: 'hsl(200 60% 55%)' }}>
                              Chore
                            </span>
                          )}
                          {permission.permissionType.appliesToSunday && (
                            <span className="px-2 py-1 rounded text-xs" style={{ background: 'hsl(45 40% 12%)', color: 'hsl(45 60% 55%)' }}>
                              Sunday
                            </span>
                          )}
                          {!permission.permissionType.appliesToChore && !permission.permissionType.appliesToSunday && (
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              N/A
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          <Calendar size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                          {permission.ethiopianStartDate || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(permission.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ended Permissions Table */}
        <div className="rounded border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="p-4 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--foreground))' }}>
              <XCircle size={18} style={{ color: 'hsl(0 60% 55%)' }} />
              Recently Ended Permissions (Last 3 Months)
            </h2>
          </div>
          
          {endedPermissions.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No permissions ended in the last 3 months
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Member
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Permission Type
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Duration
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Attendance Type
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      End Date
                    </th>
                    <th className="text-left p-4 text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {endedPermissions.map((permission) => (
                    <tr key={permission.id} className="border-b hover:bg-[hsl(var(--muted)/0.3)]" style={{ borderColor: 'hsl(var(--border))' }}>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            {permission.member.fullName || 'Unknown'}
                          </p>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {permission.member.privateId || permission.member.email || 'No ID'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                            {permission.permissionType.name}
                          </p>
                          {permission.permissionType.description && (
                            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {permission.permissionType.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          <Clock size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                          {calculateDuration(permission.ethiopianStartDate, permission.ethiopianEndDate)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {permission.permissionType.appliesToChore && (
                            <span className="px-2 py-1 rounded text-xs" style={{ background: 'hsl(200 40% 12%)', color: 'hsl(200 60% 55%)' }}>
                              Chore
                            </span>
                          )}
                          {permission.permissionType.appliesToSunday && (
                            <span className="px-2 py-1 rounded text-xs" style={{ background: 'hsl(45 40% 12%)', color: 'hsl(45 60% 55%)' }}>
                              Sunday
                            </span>
                          )}
                          {!permission.permissionType.appliesToChore && !permission.permissionType.appliesToSunday && (
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              N/A
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                          <Calendar size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                          {permission.ethiopianEndDate || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(permission.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
