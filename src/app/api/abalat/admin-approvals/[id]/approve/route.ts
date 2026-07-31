// /api/abalat/admin-approvals/[id]/approve/route.ts
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

    const registration = await prisma.adminRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        fullName: registration.fullName,
        email: registration.email,
        passwordHash: registration.passwordHash,
        type: 'ADMIN',
        mode: registration.mode,
      },
    });

    // Update registration status
    await prisma.adminRegistration.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    // Create audit log (only for ABALAT, COURSE, MEZMUR modes)
    if (registration.mode === 'ABALAT' || registration.mode === 'COURSE' || registration.mode === 'MEZMUR') {
      await createAuditLog({
        action: 'CREATE',
        entityType: 'User',
        entityId: admin.id,
        entityName: admin.fullName || undefined,
        mode: registration.mode,
        performedById: reviewerId,
      });
    }

    return NextResponse.json({ success: true, adminId: admin.id });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Approval failed' },
      { status: 500 }
    );
  }
}
