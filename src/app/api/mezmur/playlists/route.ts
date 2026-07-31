import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const playlistSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  userId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        _count: {
          select: { musicFiles: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(playlists);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load playlists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = playlistSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten() }, { status: 400 });
    }

    const { name, description, userId } = validation.data;

    const playlist = await prisma.playlist.create({
      data: { name, description, userId },
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}
