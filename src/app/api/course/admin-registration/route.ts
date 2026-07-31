// /api/course/admin-registration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { hashPassword } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    const existingRegistration = await prisma.adminRegistration.findUnique({ where: { email } });
    if (existingRegistration) return NextResponse.json({ error: 'Registration already submitted' }, { status: 400 });

    const passwordHash = await hashPassword(password);
    const registration = await prisma.adminRegistration.create({
      data: { fullName, email, passwordHash, mode: 'COURSE' },
    });

    return NextResponse.json({ success: true, registrationId: registration.id });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
