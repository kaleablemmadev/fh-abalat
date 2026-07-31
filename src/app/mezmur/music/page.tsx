import prisma from "@/src/lib/prisma";
import MusicLibraryClient from "./components/MusicLibraryClient";

async function getAdminId() {
  const admin = await prisma.user.findFirst({
    where: { type: "ADMIN" }
  }) || await prisma.user.findFirst({
    where: { type: "SUPERADMIN" }
  });
  return admin?.id || "system-admin";
}

export default async function MezmurMusicPage() {
  const adminId = await getAdminId();

  const files = await prisma.musicFile.findMany({
    include: {
      categories: true,
      uploadedBy: {
        select: { fullName: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const categories = await prisma.musicCategory.findMany({
    orderBy: { name: "asc" }
  });

  const playlists = await prisma.playlist.findMany({
    where: { userId: adminId },
    select: { id: true, name: true }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
          Music Library
        </h1>
        <p className="text-sm mt-0.5 opacity-50">
          Browse and play Mezmur recordings and practice files
        </p>
      </div>

      <MusicLibraryClient
        initialFiles={files as any}
        categories={categories as any}
        playlists={playlists as any}
      />
    </div>
  );
}
