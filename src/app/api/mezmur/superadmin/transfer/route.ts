// /api/mezmur/superadmin/transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { targetAdminId } = await request.json();

    if (!targetAdminId) {
      return NextResponse.json(
        { error: 'Target admin ID is required' },
        { status: 400 }
      );
    }

    // Get current user from session
    const sessionCookie = request.cookies.get('mode_session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.userType !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Superadmin only.' },
        { status: 403 }
      );
    }

    // Find current superadmin
    const currentSuperadmin = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!currentSuperadmin || currentSuperadmin.type !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Current user is not a superadmin' },
        { status: 403 }
      );
    }

    // Find target admin
    const targetAdmin = await prisma.user.findUnique({
      where: { id: targetAdminId },
    });

    if (!targetAdmin) {
      return NextResponse.json(
        { error: 'Target admin not found' },
        { status: 404 }
      );
    }

    if (targetAdmin.type !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Target user is not an admin' },
        { status: 400 }
      );
    }

    // Transfer ownership in a transaction
    await prisma.$transaction([
      // Demote current superadmin to admin
      prisma.user.update({
        where: { id: currentSuperadmin.id },
        data: { type: 'ADMIN' },
      }),
      // Promote target admin to superadmin
      prisma.user.update({
        where: { id: targetAdminId },
        data: { type: 'SUPERADMIN' },
      }),
      // Create notification for the new superadmin
      prisma.notification.create({
        data: {
          title: 'Superadmin Ownership Transferred',
          message: 'You have been promoted to Superadmin for the Mezmur module.',
          type: 'ADMIN',
          mode: 'MEZMUR',
          targetUserId: targetAdminId,
        },
      }),
      // Create notification for the previous superadmin
      prisma.notification.create({
        data: {
          title: 'Superadmin Ownership Transferred',
          message: 'Your superadmin ownership has been transferred. You are now an admin.',
          type: 'ADMIN',
          mode: 'MEZMUR',
          targetUserId: currentSuperadmin.id,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transfer mezmur superadmin error:', error);
    return NextResponse.json(
      { error: 'Failed to transfer ownership' },
      { status: 500 }
    );
  }
}
