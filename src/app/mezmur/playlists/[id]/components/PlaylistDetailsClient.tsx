"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Pause, Trash2, FileText, ArrowLeft, Music, Download, Loader2, X as CloseIcon, AlignLeft, AlignRight, Languages } from "lucide-react";

interface MusicFile {
  id: string;
  title: string;
  fileUrl: string | null;
  fileSize: number;
  language: "GEEZ" | "AMHARIC";
  lyrics: string;
  interpretation: string | null;
  alignment: "LEFT" | "RIGHT";
  categories: { id: string; name: string }[];
  uploadedBy: { fullName: string | null };
}

interface PlaylistDetailsClientProps {
  playlist: {
    id: string;
    name: string;
    musicFiles: MusicFile[];
  };
}

export default function PlaylistDetailsClient({ playlist }: PlaylistDetailsClientProps) {
  const [songs, setSongs] = useState(playlist.musicFiles);
  const [viewingLyrics, setViewingLyrics] = useState<MusicFile | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleRemove = async (songId: string) => {
    setIsRemoving(songId);
    try {
      const res = await fetch(`/api/mezmur/playlists/${playlist.id}/songs?musicFileId=${songId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to remove");
      setSongs(songs.filter(s => s.id !== songId));
    } catch (err) {
      alert("Error removing song");
    } finally {
      setIsRemoving(null);
    }
  };

  const handleDownload = async (file: MusicFile) => {
    if (!file.fileUrl) return;
    setDownloadingId(file.id);
    try {
      const response = await fetch(file.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/mezmur/playlists" className="inline-flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity">
        <ArrowLeft size={16} /> Back to Playlists
      </Link>

      <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        {songs.length === 0 ? (
          <div className="p-20 text-center opacity-30">
            <Music size={48} className="mx-auto mb-4" />
            <p className="text-sm font-bold">No songs in this playlist.</p>
            <Link href="/mezmur/music" className="text-xs font-bold text-[hsl(25_70%_45%)] hover:underline mt-2 block">Browse Library →</Link>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {songs.map((song) => (
              <div key={song.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[hsl(var(--accent)/0.3)] transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-bold text-sm truncate">{song.title}</h4>
                  <div className="flex flex-wrap gap-1 mt-1.5 opacity-60">
                    {song.categories.map(c => (
                      <span key={c.id} className="text-[9px] font-black uppercase bg-zinc-800 px-1.5 py-0.5 rounded">{c.name}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-zinc-900/50 rounded-lg p-1 border border-[hsl(var(--border))] w-48">
                    <audio controls className="w-full h-7 opacity-80 filter invert brightness-100 scale-90">
                        <source src={song.fileUrl || ""} type="audio/mpeg" />
                    </audio>
                  </div>

                  <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewingLyrics(song)} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] opacity-60 transition-all" title="Lyrics">
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(song)}
                        disabled={downloadingId === song.id}
                        className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-all" title="Download"
                      >
                        {downloadingId === song.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      </button>
                      <button
                        onClick={() => handleRemove(song.id)}
                        disabled={isRemoving === song.id}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all" title="Remove"
                      >
                        {isRemoving === song.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lyrics Modal - Reused logic with formatting fix */}
      {viewingLyrics && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[hsl(var(--border))] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" style={{ background: "hsl(var(--card))" }}>
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">{viewingLyrics.title}</h3>
                <p className="text-[10px] opacity-40 uppercase font-black">{viewingLyrics.language}</p>
              </div>
              <button onClick={() => setViewingLyrics(null)} className="p-2 rounded-full hover:bg-[hsl(var(--muted))] opacity-60">
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              <div
                className={`text-lg font-amharic leading-relaxed whitespace-pre-wrap ${viewingLyrics.alignment === "RIGHT" ? "text-right" : "text-left"}`}
                style={{ color: "hsl(var(--foreground))" }}
              >
                {viewingLyrics.lyrics}
              </div>
              {viewingLyrics.language === "GEEZ" && viewingLyrics.interpretation && (
                <div className="pt-8 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2 mb-4 text-emerald-500">
                    <Languages size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Amharic Interpretation</span>
                  </div>
                  <div className={`text-sm italic opacity-80 font-amharic leading-relaxed whitespace-pre-wrap ${viewingLyrics.alignment === "RIGHT" ? "text-right" : "text-left"}`}>
                    {viewingLyrics.interpretation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
