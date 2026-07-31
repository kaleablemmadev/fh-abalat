// /api/abalat/admin-registration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { hashPassword } from '@/src/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, mode } = await request.json();

    if (!fullName || !email || !password || !mode) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if registration already exists
    const existingRegistration = await prisma.adminRegistration.findUnique({
      where: { email },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Registration already submitted' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create registration
    const registration = await prisma.adminRegistration.create({
      data: {
        fullName,
        email,
        passwordHash,
        mode,
      },
    });

    return NextResponse.json({ 
      success: true, 
      registrationId: registration.id 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
