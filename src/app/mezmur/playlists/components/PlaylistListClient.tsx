"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ListMusic, Trash2, Loader2, ArrowRight, X, Save } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  _count: { musicFiles: number };
}

interface PlaylistListClientProps {
  initialPlaylists: Playlist[];
  userId: string;
}

export default function PlaylistListClient({ initialPlaylists, userId }: PlaylistListClientProps) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/mezmur/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc, userId }),
      });

      if (!res.ok) throw new Error("Failed to create");

      const playlist = await res.json();
      setPlaylists([{ ...playlist, _count: { musicFiles: 0 } }, ...playlists]);
      setNewName("");
      setNewDesc("");
      setIsCreating(false);
    } catch (err) {
      alert("Error creating playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this playlist? The songs will not be deleted.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/mezmur/playlists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPlaylists(playlists.filter(p => p.id !== id));
    } catch (err) {
      alert("Error deleting playlist");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-sm font-bold transition-all shadow-lg shadow-orange-950/20"
          >
            {isCreating ? <X size={16} /> : <Plus size={16} />}
            {isCreating ? "Cancel" : "New Playlist"}
          </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-xl border border-[hsl(var(--border))] p-6 animate-in fade-in slide-in-from-top-4" style={{ background: "hsl(var(--card))" }}>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Create New Playlist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Playlist Name</label>
                <input
                    className="w-full h-10 rounded-lg border px-4 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)]"
                    style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                    placeholder="e.g., Morning Hymns"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Description (Optional)</label>
                <input
                    className="w-full h-10 rounded-lg border px-4 text-sm transition-all outline-none focus:border-[hsl(25_70%_40%)]"
                    style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                    placeholder="Short description..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !newName.trim()}
            className="px-8 py-2 rounded-lg bg-[hsl(25_70%_45%)] text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Create Playlist
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="group relative rounded-2xl border border-[hsl(var(--border))] p-6 transition-all hover:border-[hsl(25_70%_40%)] flex flex-col justify-between h-48"
            style={{ background: "hsl(var(--card))" }}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-[hsl(25_70%_45%)]/10 text-[hsl(25_70%_45%)]">
                  <ListMusic size={24} />
                </div>
                <button
                  onClick={() => handleDelete(pl.id)}
                  disabled={deletingId === pl.id}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
                >
                  {deletingId === pl.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
              <h3 className="font-bold text-lg mt-4 truncate">{pl.name}</h3>
              <p className="text-xs opacity-50 line-clamp-1">{pl.description || "Personal collection"}</p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{pl._count.musicFiles} Songs</span>
              <Link
                href={`/mezmur/playlists/${pl.id}`}
                className="flex items-center gap-1.5 text-xs font-bold text-[hsl(25_70%_45%)] group-hover:gap-2 transition-all"
              >
                Open Library <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}

        {playlists.length === 0 && !isCreating && (
          <div className="col-span-full py-20 text-center opacity-30 flex flex-col items-center">
            <ListMusic size={64} className="mb-4" />
            <p className="text-lg font-bold">No playlists created yet.</p>
            <p className="text-sm font-medium mt-1">Start by creating your first collection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
