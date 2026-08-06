// /api/member/access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { part1, part2, context } = await request.json();

    if (!part1 || !part2 || !context) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const fullCode = context === 'ABALAT' ? `FH-${part1}-${part2}` : `FHC-${part1}-${part2}`;
    const searchField = context === 'ABALAT' ? 'privateId' : 'coursePrivateId';

    // Find member by private code in the correct field
    const member = await prisma.user.findUnique({
      where: { [searchField]: fullCode.toUpperCase().trim() } as any,
    });

    if (!member || member.type !== 'MEMBER') {
      return NextResponse.json({ error: 'Invalid access code for the selected role' }, { status: 401 });
    }

    // Verify role existence in array
    const requiredRole = context === 'ABALAT' ? 'REGULAR_MEMBER' : 'COURSE_STUDENT';
    if (!member.memberTypes.includes(requiredRole as any)) {
       return NextResponse.json({ error: 'User does not have permission for this role' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: member.id,
        fullName: member.fullName,
        type: member.type,
        memberTypes: member.memberTypes,
        mode: 'MEMBER',
        privateId: member.privateId,
        coursePrivateId: member.coursePrivateId
      }
    });
  } catch (error) {
    console.error('Member access error:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
