// src/app/api/members/[id]/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET - Get all permissions for a member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const permissions = await prisma.permission.findMany({
      where: { memberId: id },
      include: {
        permissionType: true,
        reviewedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error fetching member permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST - Create a new permission for a member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      permissionTypeId,
      reason,
      ethiopianStartDate,
    } = body;

    if (!permissionTypeId) {
      return NextResponse.json(
        { error: 'Permission type is required' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        memberId: id,
        permissionTypeId,
        reason: reason || null,
        ethiopianStartDate: ethiopianStartDate || null,
        status: 'APPROVED', // Auto-approve when assigned by admin
      },
      include: {
        permissionType: true,
      },
    });

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}
