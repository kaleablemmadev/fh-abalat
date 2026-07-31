// /api/abalat/superadmin/admins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request: NextRequest) {
  try {
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

    // Fetch all admins (not superadmin)
    const admins = await prisma.user.findMany({
      where: { 
        type: 'ADMIN',
        mode: 'ABALAT'
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
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { adminId } = await request.json();

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
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

    // Find the admin to delete
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    if (admin.type !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Target user is not an admin' },
        { status: 400 }
      );
    }

    // Create notification for the admin before deletion
    await prisma.notification.create({
      data: {
        title: 'Admin Access Removed',
        message: 'Your admin access has been removed by the superadmin. You can no longer access the admin portal.',
        type: 'ADMIN',
        mode: 'ABALAT',
        targetUserId: adminId,
      },
    });

    // Delete the admin (or demote to member)
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
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
