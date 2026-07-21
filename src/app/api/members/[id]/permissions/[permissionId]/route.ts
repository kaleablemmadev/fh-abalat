// src/app/api/members/[id]/permissions/[permissionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// DELETE - Remove a permission from a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; permissionId: string }> }
) {
  try {
    const { id, permissionId } = await params;

    // Verify the permission belongs to this member
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    if (permission.memberId !== id) {
      return NextResponse.json(
        { error: 'Permission does not belong to this member' },
        { status: 403 }
      );
    }

    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}
