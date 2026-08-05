// /api/course/members/bulk/route.ts
import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateCourseStudentCode } from "@/src/lib/utils";
import { CourseEnrollmentService } from "@/src/services/course-enrollment.service";

const studentSchema = z.object({
  fullName: z.string().min(1),
  grandfatherName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  age: z.number().int().min(1),
  gender: z.enum(["MALE", "FEMALE"]),
  courseClassId: z.string().min(1),
});

const BulkCreateSchema = z.object({
  students: z.array(studentSchema).min(1),
});

const BulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = BulkCreateSchema.safeParse(body);

  if (!result.success) {
    console.error('Bulk create validation failed:', result.error.flatten());
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { students } = result.data;

  console.log('Bulk student creation received:', students.length, 'students');
  console.log('Sample student data:', students[0]);

  // Process creations in chunks to avoid transaction timeout
  const CHUNK_SIZE = 5; // Reduced from 10 to 5 to prevent timeouts
  let totalCreated = 0;
  const errors: { index: number; error: string }[] = [];
  const createdStudents: { fullName: string | null; grandfatherName: string; studentId: string }[] = [];

  for (let i = 0; i < students.length; i += CHUNK_SIZE) {
    const chunk = students.slice(i, i + CHUNK_SIZE);
    console.log(`Processing chunk ${i}-${i + CHUNK_SIZE} with ${chunk.length} students`);

    try {
      await prisma.$transaction(async (tx) => {
        for (const student of chunk) {
          console.log(`Creating student: ${student.fullName}, ${student.grandfatherName}, ${student.courseClassId}`);
          
          // Generate a unique private ID
          let privateId = generateCourseStudentCode();
          let isUnique = false;
          let attempts = 0;
          while (!isUnique && attempts < 10) {
            const existing = await tx.user.findUnique({
              where: { privateId },
            });
            if (!existing) {
              isUnique = true;
            } else {
              privateId = generateCourseStudentCode();
              attempts++;
            }
          }

          console.log(`Generated privateId: ${privateId}`);

          // Create user record (without auto-enrollment to reduce transaction time)
          const user = await tx.user.create({
            data: {
              fullName: student.fullName,
              grandfatherName: student.grandfatherName,
              phoneNumber: student.phoneNumber || null,
              address: student.address || null,
              age: student.age,
              gender: student.gender,
              type: "MEMBER",
              memberType: "COURSE_STUDENT",
              courseClassId: student.courseClassId,
              privateId,
              isActive: true,
              enrollments: {
                create: {
                  courseClassId: student.courseClassId,
                  enrolledDate: new Date().toLocaleDateString(),
                  status: "PENDING", // Requirement: students are pending until first attendance
                }
              }
            },
          });

          console.log(`Created user with ID: ${user.id}`);

          // Track created student for PDF
          createdStudents.push({
            fullName: user.fullName,
            grandfatherName: user.grandfatherName || '',
            studentId: privateId,
          });

          totalCreated++;
          console.log(`Total created so far: ${totalCreated}`);
        }
      }, {
        timeout: 60000 // Increased from 30 to 60 seconds
      });
      
      console.log(`Chunk ${i}-${i + CHUNK_SIZE} completed successfully`);
      
      // Auto-enroll after transaction is complete (outside transaction)
      for (const student of chunk) {
        const createdStudent = createdStudents[totalCreated - chunk.length + students.indexOf(student) % chunk.length];
        if (createdStudent) {
          try {
            // Find the user by privateId to get the actual user ID
            const user = await prisma.user.findUnique({
              where: { privateId: createdStudent.studentId },
              select: { id: true }
            });
            
            if (user) {
              await CourseEnrollmentService.autoEnrollInCourses(user.id, student.courseClassId, prisma);
              console.log(`Auto-enrolled user ${user.id} in courses`);
            }
          } catch (enrollError) {
            console.error(`Auto-enrollment failed for student ${createdStudent.studentId}:`, enrollError);
            // Don't fail the whole process if auto-enrollment fails
          }
        }
      }
      
    } catch (error: any) {
      console.error(`Error in chunk ${i}-${i + CHUNK_SIZE}:`, error);
      errors.push({
        index: i,
        error: error.message || "Failed to create students in this chunk",
      });
    }
  }

  console.log(`Bulk creation completed. Total created: ${totalCreated}, Errors: ${errors.length}`);
  console.log('Created students:', createdStudents);

  return NextResponse.json({
    success: true,
    created: totalCreated,
    students: createdStudents.map(s => ({
      fullName: s.fullName,
      grandfatherName: s.grandfatherName,
      studentId: s.studentId,
    })),
    errors: errors.length > 0 ? errors : undefined,
  });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const result = BulkDeleteSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { ids } = result.data;

  // Process deletions in chunks to avoid transaction timeout
  const CHUNK_SIZE = 10;
  let totalDeleted = 0;

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);

    await prisma.$transaction(async (tx) => {
      // Delete marks
      await tx.mark.deleteMany({
        where: {
          studentId: { in: chunk }
        }
      });

      // Delete enrollments
      await tx.courseEnrollment.deleteMany({
        where: {
          studentId: { in: chunk }
        }
      });

      // Delete attendance records
      await tx.attendance.deleteMany({
        where: {
          memberId: { in: chunk }
        }
      });

      // Delete the users
      const deleted = await tx.user.deleteMany({
        where: { id: { in: chunk } },
      });

      totalDeleted += deleted.count;
    }, {
      timeout: 30000 // 30 second timeout per chunk
    });
  }

  return NextResponse.json({ success: true, deletedCount: totalDeleted });
}