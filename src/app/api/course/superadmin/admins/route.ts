// /api/course/superadmin/admins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('mode_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.userType !== 'SUPERADMIN' || session.mode !== 'COURSE') {
      return NextResponse.json({ error: 'Unauthorized. Course Superadmin only.' }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: {
        type: 'ADMIN',
        mode: 'COURSE'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error('Fetch admins error:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { adminId } = await request.json();

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    const sessionCookie = request.cookies.get('mode_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.userType !== 'SUPERADMIN' || session.mode !== 'COURSE') {
      return NextResponse.json({ error: 'Unauthorized. Course Superadmin only.' }, { status: 403 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.mode !== 'COURSE') {
      return NextResponse.json({ error: 'Admin not found or not in Course mode' }, { status: 404 });
    }

    if (admin.type !== 'ADMIN') {
      return NextResponse.json({ error: 'Target user is not an admin' }, { status: 400 });
    }

    await prisma.notification.create({
      data: {
        title: 'Admin Access Removed',
        message: 'Your admin access for Course mode has been removed by the superadmin.',
        type: 'ADMIN',
        mode: 'COURSE',
        targetUserId: adminId,
      },
    });

    await prisma.user.update({
      where: { id: adminId },
      data: {
        type: 'MEMBER',
        mode: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
