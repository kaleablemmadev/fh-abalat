import prisma from "@/src/lib/prisma";
import { supabaseAdmin } from "@/src/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/mp3"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const uploadedById = formData.get("uploadedById") as string;
    const categoryIds = formData.getAll("categoryIds") as string[];
    const language = formData.get("language") as "GEEZ" | "AMHARIC";
    const lyrics = formData.get("lyrics") as string;
    const interpretation = formData.get("interpretation") as string | null;
    const alignment = formData.get("alignment") as "LEFT" | "RIGHT";

    if (!file || !title || !uploadedById || !lyrics) {
      return NextResponse.json({ error: "Missing required fields (file, title, lyrics, or uploader)" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only audio files are allowed." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileKey = `music/${crypto.randomUUID()}.${fileExtension}`;
    const bucketName = process.env.SUPABASE_MUSIC_BUCKET || "music-files";

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileKey, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload to storage" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileKey);

    // Save to database
    const musicFile = await prisma.musicFile.create({
      data: {
        title,
        fileKey,
        fileUrl: urlData.publicUrl,
        fileSize: file.size,
        uploadedById,
        language: language || "AMHARIC",
        lyrics,
        interpretation: language === "GEEZ" ? interpretation : null,
        alignment: alignment || "LEFT",
        categories: {
          connect: categoryIds.map(id => ({ id }))
        }
      },
      include: {
        categories: true
      }
    });

    return NextResponse.json(musicFile, { status: 201 });
  } catch (error) {
    console.error("Music upload processing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
