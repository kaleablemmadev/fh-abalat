// /api/mezmur/superadmin/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newEmail, newPassword } = await request.json();

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
    const superadmin = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!superadmin) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    if (!superadmin.passwordHash) {
      return NextResponse.json(
        { error: 'No password set for this account' },
        { status: 400 }
      );
    }

    // Simple password verification (in production, use proper hashing)
    if (superadmin.passwordHash !== currentPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update data
    const updateData: any = {};

    if (newEmail) {
      // Check if email is already taken
      const existingUser = await prisma.user.findFirst({
        where: {
          email: newEmail,
          id: { not: superadmin.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }

      updateData.email = newEmail;
    }

    if (newPassword) {
      updateData.passwordHash = newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update superadmin
    await prisma.user.update({
      where: { id: superadmin.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update mezmur superadmin error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
