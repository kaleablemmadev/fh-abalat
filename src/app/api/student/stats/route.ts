import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Get student with enrollments and classes
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            courseClass: {
              include: {
                courseYears: {
                  include: {
                    course: {
                      include: { instructor: true }
                    },
                    instructor: true
                  }
                }
              }
            }
          }
        },
        marks: {
          include: {
            courseYear: {
              include: { course: true }
            }
          }
        },
        attendances: {
          include: {
            event: true,
            attendanceType: true
          },
          orderBy: { event: { date: 'desc' } },
          take: 10
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Student stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch student data' }, { status: 500 });
  }
}
