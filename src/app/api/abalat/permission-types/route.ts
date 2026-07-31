// src/app/api/permission-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET - List all permission types
export async function GET() {
  try {
    const permissionTypes = await prisma.permissionType.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(permissionTypes);
  } catch (error) {
    console.error('Error fetching permission types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission types' },
      { status: 500 }
    );
  }
}

// POST - Create a new permission type
export async function POST(request: NextRequest) {
  try {
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

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const permissionType = await prisma.permissionType.create({
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

    return NextResponse.json(permissionType, { status: 201 });
  } catch (error) {
    console.error('Error creating permission type:', error);
    return NextResponse.json(
      { error: 'Failed to create permission type' },
      { status: 500 }
    );
  }
}
