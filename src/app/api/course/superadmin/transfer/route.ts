// /api/course/superadmin/transfer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { targetAdminId } = await request.json();

    if (!targetAdminId) {
      return NextResponse.json({ error: 'Target admin ID is required' }, { status: 400 });
    }

    const sessionCookie = request.cookies.get('mode_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.userType !== 'SUPERADMIN' || session.mode !== 'COURSE') {
      return NextResponse.json({ error: 'Unauthorized. Course Superadmin only.' }, { status: 403 });
    }

    const currentSuperadmin = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!currentSuperadmin || currentSuperadmin.type !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Current user is not a superadmin' }, { status: 403 });
    }

    const targetAdmin = await prisma.user.findUnique({
      where: { id: targetAdminId },
    });

    if (!targetAdmin || targetAdmin.mode !== 'COURSE') {
      return NextResponse.json({ error: 'Target admin not found or not in Course mode' }, { status: 404 });
    }

    if (targetAdmin.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Target user is not an admin' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: currentSuperadmin.id },
        data: { type: 'ADMIN' },
      }),
      prisma.user.update({
        where: { id: targetAdmin.id },
        data: { type: 'SUPERADMIN' },
      }),
    ]);

    await prisma.notification.create({
      data: {
        title: 'Course Superadmin Ownership Transferred',
        message: `You have been promoted to Superadmin for Course mode. ${currentSuperadmin.fullName || currentSuperadmin.email} has transferred ownership to you.`,
        type: 'ADMIN',
        mode: 'COURSE',
        targetUserId: targetAdmin.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Superadmin transfer error:', error);
    return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 });
  }
}
