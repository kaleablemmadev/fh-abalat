// /api/mezmur/admin-approvals/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reviewerId } = await request.json();

    const registration = await prisma.adminRegistration.findUnique({ where: { id } });
    if (!registration) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    await prisma.adminRegistration.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rejection error:', error);
    return NextResponse.json({ error: 'Rejection failed' }, { status: 500 });
  }
}
