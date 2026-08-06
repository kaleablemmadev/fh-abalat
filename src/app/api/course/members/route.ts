import prisma from "@/src/lib/prisma";
import { z } from 'zod';
import { NextResponse, NextRequest } from "next/server";
import { genderType } from "@/src/generated/prisma";
import { generateCourseStudentCode } from "@/src/lib/utils";
import { getEthiopianToday } from "@/src/lib/ethiopiancal";
import { CourseEnrollmentService } from "@/src/services/course-enrollment.service";

export async function GET() {
    try {
        const courseMember = await prisma.user.findMany({
            where: { memberTypes: { has: "COURSE_STUDENT" } },
            include: {
                enrollments: {
                    where: { status: "ACTIVE" },
                    include: { courseClass: true }
                }
            },
            orderBy: { fullName: "asc" },
        });
        return NextResponse.json(courseMember);
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to load course students"}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const studentSchema = z.object({
            fullName: z.string().min(2),
            grandfatherName: z.string().optional(),
            gender: z.nativeEnum(genderType),
            age: z.number().min(5),
            phoneNumber: z.string().optional(),
            address: z.string().optional(),
            courseClassId: z.string().min(1, "Course Class is required")
        });
        
        const validatedData = studentSchema.parse(body);
        const ethToday = getEthiopianToday();
        const yearDigits = ethToday.year.toString().slice(-2);

        // Generate a unique coursePrivateId with new FHC-XXXX-YY format
        let coursePrivateId = generateCourseStudentCode(yearDigits);
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            const existing = await prisma.user.findUnique({
                where: { coursePrivateId },
            });
            if (!existing) {
                isUnique = true;
            } else {
                coursePrivateId = generateCourseStudentCode(yearDigits);
                attempts++;
            }
        }

        const courseMember = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName: validatedData.fullName,
                    grandfatherName: validatedData.grandfatherName,
                    gender: validatedData.gender,
                    age: validatedData.age,
                    phoneNumber: validatedData.phoneNumber,
                    address: validatedData.address,
                    memberTypes: { set: ["COURSE_STUDENT"] },
                    type: "MEMBER",
                    coursePrivateId,
                    enrollments: {
                        create: {
                            courseClassId: validatedData.courseClassId,
                            enrolledDate: new Date().toLocaleDateString(),
                            status: "PENDING" // Requirement: students are pending until first attendance
                        }
                    }
                },
                include: {
                    enrollments: {
                        include: { courseClass: true }
                    }
                }
            });

            await CourseEnrollmentService.autoEnrollInCourses(user.id, validatedData.courseClassId, tx);
            return user;
        }, {
            timeout: 30000 // 30 seconds
        });

        return NextResponse.json(courseMember);
    } catch(error) {
        console.error("Error creating student:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({error: "Failed to create course student"}, {status: 500});
    }
}
