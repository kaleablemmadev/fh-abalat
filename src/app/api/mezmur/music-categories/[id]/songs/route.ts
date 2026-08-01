import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const { musicFileIds } = await request.json();

    if (!musicFileIds || !Array.isArray(musicFileIds)) {
      return NextResponse.json({ error: "musicFileIds array is required" }, { status: 400 });
    }

    const category = await prisma.musicCategory.update({
      where: { id: categoryId },
      data: {
        musicFiles: {
          connect: musicFileIds.map(id => ({ id })),
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add songs to category" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const { searchParams } = new URL(request.url);
    const musicFileId = searchParams.get("musicFileId");

    if (!musicFileId) {
      return NextResponse.json({ error: "MusicFileId is required" }, { status: 400 });
    }

    const category = await prisma.musicCategory.update({
      where: { id: categoryId },
      data: {
        musicFiles: {
          disconnect: { id: musicFileId },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove song from category" }, { status: 500 });
  }
}
