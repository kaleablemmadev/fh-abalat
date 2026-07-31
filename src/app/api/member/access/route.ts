// /api/member/access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 });
    }

    // Find member by private code
    const member = await prisma.user.findUnique({
      where: { privateId: code.toUpperCase().trim() },
    });

    if (!member || member.type !== 'MEMBER') {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: member.id,
        fullName: member.fullName,
        type: member.type,
        mode: 'MEMBER'
      }
    });
  } catch (error) {
    console.error('Member access error:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
