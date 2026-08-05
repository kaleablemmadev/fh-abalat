import { NextResponse, NextRequest } from "next/server";
import {z} from 'zod';
import prisma from "@/src/lib/prisma";

const paramsSchema = z.object({id: z.string().min(1)});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const result = paramsSchema.safeParse(routeParams);
        if (!result.success) {
            return NextResponse.json({error: result.error.flatten()}, {status: 400});
        }
        const id = result.data.id;
        const courseMember = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: id },
                    { privateId: id }
                ]
            }
        });
        return NextResponse.json(courseMember);
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to load course member"}, {status: 500});
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const result = paramsSchema.safeParse(routeParams);
        if (!result.success) {
            return NextResponse.json({error: result.error.flatten()}, {status: 400});
        }
        const id = result.data.id;
        const body = await req.json();

        // Find the user first to get their actual database ID if an Entrance ID was provided
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: id },
                    { privateId: id }
                ]
            },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updatedMember = await prisma.user.update({
            where: { id: user.id },
            data: body
        });
        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to update course member"}, {status: 500});
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const result = paramsSchema.safeParse(routeParams);
        if (!result.success) {
            return NextResponse.json({error: result.error.flatten()}, {status: 400});
        }
        const id = result.data.id;
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: id },
                    { privateId: id }
                ]
            },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Delete related records in a transaction to avoid foreign key constraints
        await prisma.$transaction(async (tx) => {
            // Delete marks
            await tx.mark.deleteMany({
                where: {
                    studentId: user.id
                }
            });

            // Delete enrollments
            await tx.courseEnrollment.deleteMany({
                where: {
                    studentId: user.id
                }
            });

            // Delete attendance records
            await tx.attendance.deleteMany({
                where: {
                    memberId: user.id
                }
            });

            // Delete the user
            await tx.user.delete({
                where: { id: user.id }
            });
        }, {
            timeout: 30000 // 30 second timeout
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to delete course member"}, {status: 500});
    }
}
