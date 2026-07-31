import prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import PlaylistDetailsClient from "./components/PlaylistDetailsClient";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      musicFiles: {
        include: {
          categories: true,
          uploadedBy: { select: { fullName: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!playlist) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{playlist.name}</h1>
        <p className="text-sm mt-0.5 opacity-50">{playlist.description || "Personal collection"}</p>
      </div>

      <PlaylistDetailsClient
        playlist={playlist as any}
      />
    </div>
  );
}
