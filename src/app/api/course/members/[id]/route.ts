import { NextResponse, NextRequest } from "next/server";
import {z} from 'zod';
import prisma from "@/src/lib/prisma";

const paramsSchema = z.object({id: z.string().cuid()});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const routeParams = await params;
        const result = paramsSchema.safeParse(routeParams);
        if (!result.success) {
            return NextResponse.json({error: result.error.flatten()}, {status: 400});
        }
        const courseMember = await prisma.user.findUnique({where: {id: result.data.id}}); 
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
        const body = await req.json();
        const updatedMember = await prisma.user.update({where: {id: result.data.id}, data: body});
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
        const deletedMember = await prisma.user.delete({where: {id: result.data.id}}); 
        return NextResponse.json(deletedMember);
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to delete course member"}, {status: 500});
    }
}
