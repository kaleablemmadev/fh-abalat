import prisma from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    const body = await request.json();
    const { musicFileId, musicFileIds } = body;

    const idsToConnect = musicFileIds || (musicFileId ? [musicFileId] : []);

    if (idsToConnect.length === 0) {
      return NextResponse.json({ error: "At least one musicFileId is required" }, { status: 400 });
    }

    const playlist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        musicFiles: {
          connect: idsToConnect.map((id: string) => ({ id })),
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add song(s) to playlist" }, { status: 500 });
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
