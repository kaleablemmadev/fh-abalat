"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, FileText, ArrowLeft, Music, Download, Loader2, X as CloseIcon, Languages, Upload, Plus, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import BulkMusicUploadModal from "../../../music/components/BulkMusicUploadModal";
import MusicPickerModal from "../../../music/components/MusicPickerModal";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

// --- Zemach helpers ---
interface Zemach { text: string; }
function parseLyrics(raw: string): Zemach[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Zemach[];
  } catch {}
  return [{ text: raw }];
}

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

interface CategoryDetailsClientProps {
  category: {
    id: string;
    name: string;
    musicFiles: MusicFile[];
  };
  allCategories: { id: string; name: string }[];
  adminId: string;
}

export default function CategoryDetailsClient({ category, allCategories, adminId }: CategoryDetailsClientProps) {
  const router = useRouter();
  const [songs, setSongs] = useState(category.musicFiles);
  const [viewingLyrics, setViewingLyrics] = useState<MusicFile | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isPickingSongs, setIsPickingSongs] = useState(false);

  const handleRemove = async (songId: string) => {
    if (!confirm("Unlink this song from the category?")) return;
    setIsRemoving(songId);
    try {
      const res = await fetch(`/api/mezmur/music-categories/${category.id}/songs?musicFileId=${songId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to remove");
      setSongs(songs.filter(s => s.id !== songId));
      router.refresh();
    } catch (err) {
      alert("Error removing song");
    } finally {
      setIsRemoving(null);
    }
  };

  const handleAddExisting = async (musicFileIds: string[]) => {
    const res = await fetch(`/api/mezmur/music-categories/${category.id}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musicFileIds }),
    });
    if (!res.ok) throw new Error("Failed to add songs");
    router.refresh();
    window.location.reload(); // Refresh state
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/mezmur/music-categories" className="inline-flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity">
          <ArrowLeft size={16} /> Back to Categories
        </Link>

        <div className="flex gap-2">
            <button
                onClick={() => setIsPickingSongs(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-xs font-bold transition-all border border-[hsl(var(--border))]"
            >
                <Plus size={14} /> Add from Library
            </button>
            <button
                onClick={() => setIsBulkUploading(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(25_70%_45%)] hover:bg-[hsl(25_70%_40%)] text-white text-xs font-bold transition-all"
            >
                <Upload size={14} /> Bulk Upload
            </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        {songs.length === 0 ? (
          <div className="p-20 text-center opacity-30">
            <Music size={48} className="mx-auto mb-4" />
            <p className="text-sm font-bold">No songs in this category.</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {songs.map((song) => (
              <div key={song.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[hsl(var(--accent)/0.3)] transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-bold text-sm truncate">{song.title}</h4>
                  <p className="text-[10px] opacity-40 mt-0.5 uppercase tracking-widest font-bold">Uploaded by {song.uploadedBy.fullName || "Admin"}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-[hsl(var(--border))] w-64 overflow-hidden">
                    <AudioPlayer
                        src={song.fileUrl || ""}
                        showJumpControls={false}
                        layout="horizontal-reverse"
                        customAdditionalControls={[]}
                        customVolumeControls={[]}
                        style={{ background: "transparent", boxShadow: "none", padding: "2px 8px" }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                      <button onClick={() => setViewingLyrics(song)} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] opacity-60 transition-all" title="Lyrics">
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => handleRemove(song.id)}
                        disabled={isRemoving === song.id}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all" title="Remove from Category"
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

      {/* Modals */}
      {isBulkUploading && (
        <BulkMusicUploadModal
            categories={allCategories}
            adminId={adminId}
            targetCategoryId={category.id}
            onClose={() => setIsBulkUploading(false)}
            onSuccess={() => {
                router.refresh();
                window.location.reload();
            }}
        />
      )}

      {isPickingSongs && (
        <MusicPickerModal
            onClose={() => setIsPickingSongs(false)}
            alreadyAddedIds={songs.map(s => s.id)}
            onAdd={handleAddExisting}
        />
      )}

      {/* Lyrics Modal */}
      {viewingLyrics && (() => {
        const zemachs = parseLyrics(viewingLyrics.lyrics);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-[hsl(var(--border))] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" style={{ background: "hsl(var(--card))" }}>
              <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{viewingLyrics.title}</h3>
                  <p className="text-[10px] opacity-40 uppercase font-black">
                    {viewingLyrics.language} · {zemachs.length} zemach{zemachs.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button onClick={() => setViewingLyrics(null)} className="p-2 rounded-full hover:bg-[hsl(var(--muted))] opacity-60">
                  <CloseIcon size={20} />
                </button>
              </div>

              {/* Audio Player in Modal */}
              {viewingLyrics.fileUrl && (
                <div className="px-8 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.1)]">
                  <div className="rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                    <AudioPlayer
                      src={viewingLyrics.fileUrl}
                      showJumpControls={false}
                      layout="horizontal-reverse"
                      customAdditionalControls={[]}
                      customVolumeControls={[]}
                      style={{
                        background: "hsl(var(--muted)/0.3)",
                        boxShadow: "none",
                        padding: "8px 12px"
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {zemachs.map((zemach, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{
                            background: isLeft ? "hsl(25 70% 45% / 0.12)" : "hsl(210 70% 45% / 0.12)",
                            color: isLeft ? "hsl(25 70% 55%)" : "hsl(210 70% 60%)"
                          }}
                        >
                          Zemach {index + 1}
                        </span>
                        <div className="flex-1 h-px opacity-10" style={{ background: "hsl(var(--foreground))" }} />
                      </div>
                      <div
                        className={`text-lg font-amharic leading-relaxed whitespace-pre-wrap ${isLeft ? "text-left" : "text-right"}`}
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {zemach.text}
                      </div>
                    </div>
                  );
                })}
                {viewingLyrics.language === "GEEZ" && viewingLyrics.interpretation && (
                  <div className="pt-8 border-t border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2 mb-4 text-emerald-500">
                      <Languages size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Amharic Interpretation</span>
                    </div>
                    <div className="text-sm italic opacity-80 font-amharic leading-relaxed whitespace-pre-wrap text-left">
                      {viewingLyrics.interpretation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
