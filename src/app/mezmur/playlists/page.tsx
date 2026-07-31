import prisma from "@/src/lib/prisma";
import PlaylistListClient from "./components/PlaylistListClient";

async function getAdminId() {
  const admin = await prisma.user.findFirst({
    where: { type: "ADMIN" }
  }) || await prisma.user.findFirst({
    where: { type: "SUPERADMIN" }
  });
  return admin?.id || "system-admin";
}

export default async function MezmurPlaylistsPage() {
  const adminId = await getAdminId();

  const playlists = await prisma.playlist.findMany({
    where: { userId: adminId },
    include: {
      _count: {
        select: { musicFiles: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Playlists</h1>
        <p className="text-sm opacity-50">Manage your personalized song collections</p>
      </div>

      <PlaylistListClient initialPlaylists={playlists as any} userId={adminId} />
    </div>
  );
}
