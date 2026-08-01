// /api/course/superadmin/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { verifyPassword, hashPassword } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newEmail, newPassword } = await request.json();

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
    }

    const sessionCookie = request.cookies.get('mode_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.userType !== 'SUPERADMIN' || session.mode !== 'COURSE') {
      return NextResponse.json({ error: 'Unauthorized. Course Superadmin only.' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const updateData: any = {};
    if (newEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 });
      }
      updateData.email = newEmail;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(newPassword);
      updateData.mustChangePassword = false;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Superadmin update error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
