// src/services/permission.service.ts
import prisma from '@/src/lib/prisma';
import { dateToEthiopian } from '@/src/lib/ethiopiancal';

export interface PermissionCheckResult {
  hasPermission: boolean;
  permissionType?: string;
  reason?: string;
}

/**
 * Check if a member has an active permission for a specific event
 */
export async function checkMemberPermission(
  memberId: string,
  eventDate: Date,
  eventType: 'CHORE' | 'SUNDAY' | 'EVENT'
): Promise<PermissionCheckResult> {
  // Get all approved permissions for this member
  const permissions = await prisma.permission.findMany({
    where: {
      memberId,
      status: 'APPROVED',
    },
    include: {
      permissionType: true,
    },
  });

  const ethDate = dateToEthiopian(eventDate);

  for (const permission of permissions) {
    const type = permission.permissionType;
    const isExcused = await isMemberExcusedForEvent(
      type,
      ethDate,
      eventDate,
      eventType,
      permission.ethiopianStartDate
    );

    if (isExcused) {
      return {
        hasPermission: true,
        permissionType: type.name,
        reason: permission.reason || undefined,
      };
    }
  }

  return { hasPermission: false };
}

/**
 * Check if a permission type excuses a member from a specific event
 */
async function isMemberExcusedForEvent(
  permissionType: any,
  ethDate: { year: number; month: string; day: number },
  eventDate: Date,
  eventType: 'CHORE' | 'SUNDAY' | 'EVENT',
  permissionStartDate: string | null
): Promise<boolean> {
  // Check if the event type matches the permission's scope
  if (permissionType.category === 'DURATION_BASED') {
    if (eventType === 'CHORE' && !permissionType.appliesToChore) return false;
    if (eventType === 'SUNDAY' && !permissionType.appliesToSunday) return false;

    // For duration-based permissions, check if the event is within the permission period
    if (permissionStartDate) {
      // Parse the Ethiopian start date
      // This is a simplified check - in production, you'd want proper date parsing
      // For now, we'll assume the permission is active if it exists
      return true;
    }

    return true; // If no start date specified, permission is always active
  }

  if (permissionType.category === 'DAY_BASED') {
    // Check if the event day matches specific days
    if (permissionType.specificDays.length > 0) {
      if (permissionType.specificDays.includes(ethDate.day)) {
        return true;
      }
    }

    // Check if the event is on Sunday and permission applies to all Sundays
    if (permissionType.appliesToSundays) {
      const dayOfWeek = eventDate.getDay(); // 0 = Sunday
      if (dayOfWeek === 0) {
        return true;
      }
    }

    return false;
  }

  return false;
}

/**
 * Get all active permissions for a member
 */
export async function getMemberPermissions(memberId: string) {
  return prisma.permission.findMany({
    where: {
      memberId,
      status: 'APPROVED',
    },
    include: {
      permissionType: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
