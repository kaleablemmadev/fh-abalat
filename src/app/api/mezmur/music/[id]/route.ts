import prisma from "@/src/lib/prisma";
import { supabaseAdmin } from "@/src/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const musicFile = await prisma.musicFile.findUnique({
      where: { id },
      include: {
        categories: true,
        uploadedBy: true,
      },
    });

    if (!musicFile) {
      return NextResponse.json({ error: "Music file not found" }, { status: 404 });
    }

    return NextResponse.json(musicFile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Simple update for lyrics/alignment/interpretation
    const updated = await prisma.musicFile.update({
      where: { id },
      data: {
        title: body.title,
        language: body.language,
        lyrics: body.lyrics,
        interpretation: body.interpretation,
        alignment: body.alignment,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const musicFile = await prisma.musicFile.findUnique({
      where: { id },
    });

    if (!musicFile) {
      return NextResponse.json({ error: "Music file not found" }, { status: 404 });
    }

    const bucketName = process.env.SUPABASE_MUSIC_BUCKET || "music-files";

    // Delete from Supabase Storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([musicFile.fileKey]);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      // We continue even if storage delete fails to keep DB in sync if storage is already gone
    }

    // Delete from database
    await prisma.musicFile.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
