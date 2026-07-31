import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const { musicFileId } = await request.json();

    if (!musicFileId) {
      return NextResponse.json({ error: "MusicFileId is required" }, { status: 400 });
    }

    const playlist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        musicFiles: {
          connect: { id: musicFileId },
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add song to playlist" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const { searchParams } = new URL(request.url);
    const musicFileId = searchParams.get("musicFileId");

    if (!musicFileId) {
      return NextResponse.json({ error: "MusicFileId is required" }, { status: 400 });
    }

    const playlist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        musicFiles: {
          disconnect: { id: musicFileId },
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove song from playlist" }, { status: 500 });
  }
}
