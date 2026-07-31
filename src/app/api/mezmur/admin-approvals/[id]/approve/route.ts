// /api/mezmur/admin-approvals/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { createAuditLog } from '@/src/services/audit.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reviewerId } = await request.json();

    const registration = await prisma.adminRegistration.findUnique({ where: { id } });
    if (!registration) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    const admin = await prisma.user.create({
      data: {
        fullName: registration.fullName,
        email: registration.email,
        passwordHash: registration.passwordHash,
        type: 'ADMIN',
        mode: 'MEZMUR',
      },
    });

    await prisma.adminRegistration.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'User',
      entityId: admin.id,
      entityName: admin.fullName || undefined,
      mode: 'MEZMUR',
      performedById: reviewerId,
    });

    return NextResponse.json({ success: true, adminId: admin.id });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
