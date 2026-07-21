// src/app/api/permission-types/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET - Get a single permission type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const permissionType = await prisma.permissionType.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            member: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    if (!permissionType) {
      return NextResponse.json(
        { error: 'Permission type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(permissionType);
  } catch (error) {
    console.error('Error fetching permission type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission type' },
      { status: 500 }
    );
  }
}

// PUT - Update a permission type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      category,
      durationMonths,
      durationYears,
      appliesToChore,
      appliesToSunday,
      specificDays,
      appliesToSundays,
    } = body;

    const permissionType = await prisma.permissionType.update({
      where: { id },
      data: {
        name,
        description: description || null,
        category,
        durationMonths: category === 'DURATION_BASED' ? durationMonths || null : null,
        durationYears: category === 'DURATION_BASED' ? durationYears || null : null,
        appliesToChore: category === 'DURATION_BASED' ? appliesToChore || false : false,
        appliesToSunday: category === 'DURATION_BASED' ? appliesToSunday || false : false,
        specificDays: category === 'DAY_BASED' ? specificDays || [] : [],
        appliesToSundays: category === 'DAY_BASED' ? appliesToSundays || false : false,
      },
    });

    return NextResponse.json(permissionType);
  } catch (error) {
    console.error('Error updating permission type:', error);
    return NextResponse.json(
      { error: 'Failed to update permission type' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a permission type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if permission type has any permissions assigned
    const permissionsCount = await prisma.permission.count({
      where: { permissionTypeId: id },
    });

    if (permissionsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete permission type with assigned permissions' },
        { status: 400 }
      );
    }

    await prisma.permissionType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission type:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission type' },
      { status: 500 }
    );
  }
}
