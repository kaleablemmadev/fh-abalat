import prisma from "@/src/lib/prisma";
import MemberMusicPlayer from "./components/MemberMusicPlayer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MusicPlayerPage({
  searchParams,
}: {
  searchParams: { categoryId?: string; categoryIds?: string; playAll?: string };
}) {
  const { categoryId, categoryIds, playAll } = searchParams;

  let musicFiles: any[] = [];
  let title = "Music Player";

  if (playAll === "true") {
    musicFiles = await prisma.musicFile.findMany({
      select: {
        id: true,
        title: true,
        fileUrl: true,
        lyrics: true,
        language: true,
        interpretation: true,
      },
      orderBy: { title: 'asc' }
    });
    title = "All Music Library";
  } else if (categoryIds) {
    const ids = categoryIds.split(",");
    musicFiles = await prisma.musicFile.findMany({
      where: {
        categories: {
          some: { id: { in: ids } }
        }
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        lyrics: true,
        language: true,
        interpretation: true,
      },
      orderBy: { title: 'asc' }
    });
    title = "Selected Categories";
  } else if (categoryId) {
    const category = await prisma.musicCategory.findUnique({
      where: { id: categoryId },
      include: {
        musicFiles: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
            lyrics: true,
            language: true,
            interpretation: true,
          },
          orderBy: { title: 'asc' }
        }
      }
    });
    if (category) {
      musicFiles = category.musicFiles;
      title = category.name;
    }
  }

  if (musicFiles.length === 0) {
    redirect("/member/music-categories");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] animate-fade-in">
      <div className="p-4 flex items-center gap-4 border-b border-[hsl(var(--border))]">
        <Link
          href="/member/music-categories"
          className="p-2 rounded-full hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-xs opacity-50">{musicFiles.length} songs</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <MemberMusicPlayer musicFiles={musicFiles as any} categoryName={title} />
      </div>
    </div>
  );
}
