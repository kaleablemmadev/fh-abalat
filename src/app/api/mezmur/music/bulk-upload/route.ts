import prisma from "@/src/lib/prisma";
import { supabaseAdmin } from "@/src/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/mp3"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const uploadedById = formData.get("uploadedById") as string;
    const categoryIds = formData.getAll("categoryIds") as string[];
    const playlistId = formData.get("playlistId") as string | null;
    const language = (formData.get("language") as "GEEZ" | "AMHARIC") || "AMHARIC";
    const alignment = (formData.get("alignment") as "LEFT" | "RIGHT") || "LEFT";

    if (!files || files.length === 0 || !uploadedById) {
      return NextResponse.json({ error: "Missing required fields (files or uploader)" }, { status: 400 });
    }

    const bucketName = process.env.SUPABASE_MUSIC_BUCKET || "music-files";
    const results = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) continue;
      if (!ALLOWED_TYPES.includes(file.type)) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExtension = file.name.split('.').pop();
      const fileKey = `music/${crypto.randomUUID()}.${fileExtension}`;

      // Upload to Supabase
      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileKey, buffer, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        console.error(`Failed to upload ${file.name}:`, uploadError);
        continue;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(fileKey);

      // Create record
      const musicFile = await prisma.musicFile.create({
        data: {
          title: file.name.split(".")[0],
          fileKey,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          uploadedById,
          language,
          lyrics: file.name.split(".")[0], // Default lyrics to title
          alignment,
          categories: {
            connect: categoryIds.map(id => ({ id }))
          },
          playlists: playlistId ? {
            connect: { id: playlistId }
          } : undefined
        }
      });

      results.push(musicFile);
    }

    return NextResponse.json({ success: true, count: results.length, files: results }, { status: 201 });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
