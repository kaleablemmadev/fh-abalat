import prisma from "@/src/lib/prisma";
import { z } from 'zod';
import { NextResponse, NextRequest } from "next/server";
import { genderType } from "@/src/generated/prisma/enums";

export async function GET() {
    try {
        const courseMember = await prisma.user.findMany({
            where: { memberType: "COURSE_STUDENT" },
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
            gender: z.nativeEnum(genderType),
            age: z.number().min(10),
            christianName: z.string().optional(),
            registerDateDay: z.number().optional(),
            registerDateMonth: z.string().optional(),
            registerDateYear: z.number().optional(),
            address: z.string().optional()
        });
        
        const student = studentSchema.parse(body);

        const courseMember = await prisma.user.create({
            data: {
                fullName: student.fullName,
                gender: student.gender,
                age: student.age,
                christianName: student.christianName,
                registerDateDay: student.registerDateDay,
                registerDateMonth: student.registerDateMonth,
                registerDateYear: student.registerDateYear,
                address: student.address,
                memberType: "COURSE_STUDENT"
            }
        });

        return NextResponse.json(courseMember);
    } catch(error) {
        console.error(error);
        return NextResponse.json({error: "Failed to create course student"}, {status: 500});
    }
}