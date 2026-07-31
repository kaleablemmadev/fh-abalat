import prisma from '@/src/lib/prisma';

export interface AuditLogOptions {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: Record<string, any>;
  mode: 'ABALAT' | 'COURSE' | 'MEZMUR';
  performedById: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(options: AuditLogOptions) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        entityName: options.entityName,
        changes: options.changes ? JSON.stringify(options.changes) : null,
        mode: options.mode,
        performedById: options.performedById,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    });

    // Create notifications for all admins in the same mode
    await notifyAdminsOfAudit(auditLog, options.mode);

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    throw error;
  }
}

async function notifyAdminsOfAudit(auditLog: any, mode: 'ABALAT' | 'COURSE' | 'MEZMUR') {
  try {
    // Get all admins and superadmins for this mode
    const admins = await prisma.user.findMany({
      where: {
        type: { in: ['ADMIN', 'SUPERADMIN'] },
        mode: mode,
      },
    });

    // Create notifications for each admin
    const notifications = admins.map((admin) =>
      prisma.notification.create({
        data: {
          title: `${auditLog.action} - ${auditLog.entityType}`,
          message: `${auditLog.entityName || auditLog.entityId} was ${auditLog.action.toLowerCase()} by ${auditLog.performedById}`,
          type: 'AUDIT',
          mode: mode,
          targetUserId: admin.id,
          auditLogId: auditLog.id,
        },
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
}

export async function getAuditLogs(mode: 'ABALAT' | 'COURSE' | 'MEZMUR', limit = 50) {
  try {
    return await prisma.auditLog.findMany({
      where: { mode },
      include: {
        performedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
}

export async function getAuditLogsByEntity(mode: 'ABALAT' | 'COURSE' | 'MEZMUR', entityType: string, entityId: string) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        mode,
        entityType,
        entityId,
      },
      include: {
        performedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to get audit logs by entity:', error);
    throw error;
  }
}
